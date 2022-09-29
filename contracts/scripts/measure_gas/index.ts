/* eslint-disable no-process-exit */
/**
 * yarn hardhat run ./scripts/measure_gas --network network_from_hardhat_config
 */

import {
  BigNumber,
  BigNumberish,
  ContractTransaction,
  ContractReceipt,
} from "ethers";
import { solidityPack } from "ethers/lib/utils";
import { network } from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";
import Web3 from "web3";
import { BlsWalletWrapper, Bundle } from "../../clients/src";
import Fixture from "../../shared/helpers/Fixture";
import TokenHelper from "../../shared/helpers/TokenHelper";
// import { processGasResultsToFile } from "./format";
import { Rng } from "./rng";

type TransactionType = "transfer";
type TransactionMode = "normal" | "bls" | "blsExpander";

type ArbitrumGasMeasurement = {
  gasUsedForL1: number;
};

type GasMeasurement = Readonly<{
  numTransactions: number;
  transaction: {
    type: TransactionType;
    mode: TransactionMode;
    hash: string;
    sizeBytes: number;
  };
  gas: {
    used: number;
    price: number;
    arbitrum?: ArbitrumGasMeasurement;
  };
}>;

type GasMeasurementError = Readonly<{
  numTransactions: number;
  transaction: {
    type: TransactionType;
    mode: TransactionMode;
  };
  error: Error;
}>;

type GasMeasurementContext = Readonly<{
  fx: Fixture;
  th: TokenHelper;
  rng: Rng;
  blsWallets: BlsWalletWrapper[];
  numTransactions: number;
  web3Provider: Web3;
}>;
type InitialContext = Omit<GasMeasurementContext, "numTransactions">;

type GasMeasurementTransactionConfig = Readonly<{
  mode: TransactionMode;
  type: TransactionType;
  factoryFunc: (ctx: GasMeasurementContext) => Promise<ContractTransaction>;
  postMeasurementFunc?: (measurement: GasMeasurement) => GasMeasurement;
}>;

type GasMeasurementConfig = Readonly<{
  seed: string;
  numBlsWallets: number;
  transactionBatches: number[];
  transactionConfigs: GasMeasurementTransactionConfig[];
}>;

const getTransferAmount = (ctx: GasMeasurementContext): BigNumber => {
  return BigNumber.from(ctx.rng.int(1, ctx.blsWallets.length));
};

const createNormalTransfer = (
  ctx: GasMeasurementContext,
): Promise<ContractTransaction> => {
  const signer = ctx.fx.signers[0];
  const toAddress = ctx.rng.item(ctx.blsWallets).address;
  const amount = getTransferAmount(ctx);

  return ctx.th.testToken.connect(signer).transfer(toAddress, amount);
};

const postNormalTransfer = (measurement: GasMeasurement): GasMeasurement => {
  const arbitrum = measurement.gas.arbitrum
    ? {
        ...measurement.gas.arbitrum,
        gasUsedForL1:
          measurement.gas.arbitrum.gasUsedForL1 * measurement.numTransactions,
      }
    : undefined;

  return {
    ...measurement,
    transaction: {
      ...measurement.transaction,
      sizeBytes:
        measurement.transaction.sizeBytes * measurement.numTransactions,
    },
    gas: {
      ...measurement.gas,
      used: measurement.gas.used * measurement.numTransactions,
      arbitrum,
    },
  };
};

const createBlsTransfers = async (
  ctx: GasMeasurementContext,
): Promise<ContractTransaction> => {
  const signer = ctx.fx.signers[0];

  const bundles: Bundle[] = [];
  const walletNonces = await Promise.all(
    ctx.blsWallets.map(async (w) => {
      const n = await w.Nonce();
      return n.toNumber();
    }),
  );

  for (let i = 0; i < ctx.numTransactions; i++) {
    const walletIdx = ctx.rng.int(0, ctx.blsWallets.length);
    const blsWallet = ctx.blsWallets[walletIdx];

    const toAddress = ctx.rng.item(ctx.blsWallets, [blsWallet]).address;
    const amount = getTransferAmount(ctx);

    const nonce = walletNonces[walletIdx]++;
    const bundle = blsWallet.sign({
      nonce,
      actions: [
        {
          contractAddress: ctx.th.testToken.address,
          encodedFunction: ctx.th.testToken.interface.encodeFunctionData(
            "transfer",
            [toAddress, amount],
          ),
          ethValue: 0,
        },
      ],
    });

    bundles.push(bundle);
  }

  const aggBundle = ctx.fx.blsWalletSigner.aggregate(bundles);

  return ctx.fx.verificationGateway.connect(signer).processBundle(aggBundle);
};

const createBlsExpanderTransfers = async (
  ctx: GasMeasurementContext,
): Promise<ContractTransaction> => {
  const signer = ctx.fx.signers[0];
  const sendingWallet = ctx.rng.item(ctx.blsWallets);

  const actions = [];

  for (let i = 0; i < ctx.numTransactions; i++) {
    const toAddress = ctx.rng.item(ctx.blsWallets, [sendingWallet]).address;
    const amount = getTransferAmount(ctx);

    actions.push({
      ethValue: 0,
      contractAddress: ctx.th.testToken.address,
      encodedFunction: ctx.th.testToken.interface.encodeFunctionData(
        "transfer",
        [toAddress, amount],
      ),
    });
  }

  const operation = {
    nonce: await sendingWallet.Nonce(),
    actions,
  };
  const bundle = sendingWallet.sign(operation);

  const encodedFunction = solidityPack(
    ["bytes"],
    [operation.actions[0].encodedFunction],
  );
  const methodId = encodedFunction.slice(0, 10);
  const encodedParamSets = operation.actions.map(
    (a) => `0x${a.encodedFunction.slice(10)}`,
  );

  return ctx.fx.blsExpander
    .connect(signer)
    .blsCallMultiSameCallerContractFunction(
      sendingWallet.PublicKey(),
      operation.nonce,
      bundle.signature,
      ctx.th.testToken.address,
      methodId,
      encodedParamSets,
    );
};

const init = async (cfg: GasMeasurementConfig): Promise<InitialContext> => {
  const rng = new Rng(cfg.seed);
  const generateSecret = () => Math.abs((rng.random() * 0xffffffff) << 0);
  const secretNumbers = Array.from(
    { length: cfg.numBlsWallets },
    generateSecret,
  );

  const fx = await Fixture.create(secretNumbers.length, secretNumbers);
  const th = new TokenHelper(fx);
  const blsWallets = await th.walletTokenSetup();

  /**
   * Web3 needs to be used over ethers.js since its transaction
   * receipts do not have the 'gasUsedForL1' property stripped out.
   */
  const rpcUrl = (network.config as HttpNetworkConfig).url;
  if (!rpcUrl) {
    throw new Error("ethers.js network config does not have url");
  }
  const web3Provider = new Web3(rpcUrl);

  return {
    fx,
    th,
    rng,
    blsWallets,
    web3Provider,
  };
};

const getArbitrumMeasurements = async (
  web3Provider: Web3,
  txnHash: string,
): Promise<ArbitrumGasMeasurement | undefined> => {
  const web3Receipt = await web3Provider.eth.getTransactionReceipt(txnHash);
  const { gasUsedForL1 } = web3Receipt as unknown as {
    gasUsedForL1?: BigNumberish;
  };
  if (!gasUsedForL1) {
    return undefined;
  }
  return { gasUsedForL1: BigNumber.from(gasUsedForL1).toNumber() };
};

const getTransactionSizeBytes = (txnData: string): number => {
  /**
   * txn.data is a DataHexstring (https://docs.ethers.io/v5/api/utils/bytes/#DataHexString)
   * so can assume if will be even in length.
   *
   * One hex character = 4 bits (nibble)
   * so every 2 will be 1 byte.
   */
  const hexIdentifierLen = 2; // 0x
  const hexCharPerByte = 2;
  return (txnData.length - hexIdentifierLen) / hexCharPerByte;
};

const getMeasurements = async (
  { numTransactions, web3Provider }: GasMeasurementContext,
  { mode, type }: GasMeasurementTransactionConfig,
  txn: ContractTransaction,
  receipt: ContractReceipt,
): Promise<GasMeasurement> => {
  const arbitrum = await getArbitrumMeasurements(
    web3Provider,
    receipt.transactionHash,
  );

  return {
    numTransactions,
    transaction: {
      mode,
      type,
      hash: receipt.transactionHash,
      sizeBytes: getTransactionSizeBytes(txn.data),
    },
    gas: {
      used: receipt.gasUsed.toNumber(),
      price: receipt.effectiveGasPrice.toNumber(),
      arbitrum,
    },
  };
};

const measureGas = async (cfg: GasMeasurementConfig): Promise<void> => {
  console.log("measuring gas for BLS Wallet contracts");

  console.log();
  console.log("config: ");
  console.log(JSON.stringify(cfg, null, 4));

  console.log();
  const transactionTypes = cfg.transactionConfigs
    .map((tc) => `${tc.mode}:${tc.type}`)
    .join(", ");
  console.log(`transaction modes & types: ${transactionTypes}`);
  console.log(`transactions per batch: ${cfg.transactionBatches.join(", ")}`);
  console.log(`# of bls wallets: ${cfg.numBlsWallets}`);
  console.log(`seed: ${cfg.seed}`);
  console.log();

  const initCtx = await init(cfg);

  const measurements: Array<GasMeasurement | GasMeasurementError> = [];

  for (const txnCfg of cfg.transactionConfigs) {
    for (const numTxns of cfg.transactionBatches) {
      console.log(
        `running ${txnCfg.type}, mode ${txnCfg.mode}. # of transactions: ${numTxns}`,
      );

      const ctx = { ...initCtx, numTransactions: numTxns };

      try {
        const txn = await txnCfg.factoryFunc(ctx);
        console.log(`txn hash: ${txn.hash}`);
        const receipt = await txn.wait();
        console.log("transaction complete");

        const m = await getMeasurements(ctx, txnCfg, txn, receipt);
        const measurement = txnCfg.postMeasurementFunc
          ? await txnCfg.postMeasurementFunc(m)
          : m;
        measurements.push(measurement);
        console.log("measurement complete");
      } catch (err) {
        console.error(err);

        measurements.push({
          numTransactions: numTxns,
          transaction: {
            type: txnCfg.type,
            mode: txnCfg.mode,
          },
          error: err,
        });

        continue;
      }
    }
  }

  console.log("all gas measuements complete");

  // TODO consider removing
  console.warn(`gas measurements: ${JSON.stringify(measurements, null, 4)}`);

  // TODO Write to MD file
  // Store gas results to file if testing on Arbitrum network
  // const shouldSaveResults = [
  //   "arbitrum_testnet",
  //   "arbitrum_testnet_goerli",
  // ].includes(network.name);
  // if (shouldSaveResults) {
  //   console.log("Sending normal token transfer...");
  //   const normalResponse = await th.testToken
  //     .connect(fx.signers[0])
  //     .transfer(testAddress, testAmount);
  //   const normalTransferReceipt = await normalResponse.wait();

  //   await processGasResultsToFile(
  //     fx.provider,
  //     receipt.transactionHash,
  //     normalTransferReceipt.transactionHash,
  //     transferCount,
  //   );
  // }

  console.log("done");
  console.log();
};

async function main() {
  /**
   * TODO Test cases for:
   * - (?) address book trasnfer
   */
  const config: GasMeasurementConfig = {
    seed: "bls_wallet_measure_gas",
    numBlsWallets: 16,
    // Max tested limited on goerli arbitrum is 151 bls transfers.
    transactionBatches: [1, 2, 10, 20, 50, 100, 150],
    transactionConfigs: [
      {
        type: "transfer",
        mode: "normal",
        factoryFunc: createNormalTransfer,
        postMeasurementFunc: postNormalTransfer,
      },
      {
        type: "transfer",
        mode: "bls",
        factoryFunc: createBlsTransfers,
      },
      {
        type: "transfer",
        mode: "blsExpander",
        factoryFunc: createBlsExpanderTransfers,
      },
    ],
  };

  await measureGas(config);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
