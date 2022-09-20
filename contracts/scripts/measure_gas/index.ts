/**
 * yarn hardhat run ./scripts/measure_gas --network gethDev
 */

/* eslint-disable no-process-exit */
import { BigNumber, ContractTransaction, ContractReceipt } from "ethers";
// import { solidityPack } from "ethers/lib/utils";
// import { network } from "hardhat";
import { BlsWalletWrapper } from "../../clients/src";
import Fixture from "../../shared/helpers/Fixture";
import TokenHelper from "../../shared/helpers/TokenHelper";
// import { processGasResultsToFile } from "./format";
import { Rng } from "./rng";

type TransactionType = "transfer";
type TransactionMode = "normal" | "bls" | "blsExpander";

type GasMeasurement = Readonly<{
  numTransactions: number;
  transaction: {
    type: TransactionType;
    mode: TransactionMode;
    hash: string;
  };
  // TODO Split this into L1 & l2?
  gas: {
    used: number;
    price: number;
  };
}>;

type GasMeasurementContext = Readonly<{
  th: TokenHelper;
  rng: Rng;
  blsWallets: BlsWalletWrapper[];
  numTransactions: number;
}>;

type GasMeasurementTransactionConfig = Readonly<{
  mode: TransactionMode;
  type: TransactionType;
  factoryFunc: (ctx: GasMeasurementContext) => Promise<ContractTransaction>;
  postMeasurementFunc?: (
    ctx: GasMeasurementContext,
    measurement: GasMeasurement,
  ) => GasMeasurement;
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
  const signer = ctx.th.fx.signers[0];
  const toAddress = ctx.rng.item(ctx.blsWallets).address;
  const amount = getTransferAmount(ctx);

  return ctx.th.testToken.connect(signer).transfer(toAddress, amount);
};

// const createBlsTransfers = (
//   ctx: GasMeasurementContext,
// ): Promise<ContractTransaction> => {
//   throw new Error("TODO implement");
//   const actionsArr = [];
//   const encodedFunctions = [];
//   const testAddress = "0x" + (1).toString(16).padStart(40, "0");

//   for (let i = 0; i < transferCount; i++) {
//     encodedFunctions.push(
//       th.testToken.interface.encodeFunctionData("transfer", [
//         testAddress,
//         testAmount,
//       ]),
//     );

//     actionsArr.push({
//       ethValue: BigNumber.from(0),
//       contractAddress: th.testToken.address,
//       encodedFunction: encodedFunctions[i],
//     });
//   }

//   const operation = {
//     nonce: BigNumber.from(nonce),
//     actions: actionsArr,
//   };
//   const tx = blsWallets[0].sign(operation);

//   const aggTx = fx.blsWalletSigner.aggregate([tx]);
//   console.log("Done signing & aggregating.");

//   const encodedFunction = solidityPack(
//     ["bytes"],
//     [tx.operations[0].actions[0].encodedFunction],
//   );

//   const methodId = encodedFunction.slice(0, 10);
//   const encodedParamSets = encodedFunctions.map(
//     (encFunction) => `0x${encFunction.slice(10)}`,
//   );

//   const publicKey = fx.blsWalletSigner.getPublicKey(blsWallets[0].privateKey);

//   console.log("Estimating...", fx.blsExpander.address);
//   const gasEstimate =
//     await fx.blsExpander.estimateGas.blsCallMultiSameCallerContractFunction(
//       publicKey,
//       nonce,
//       aggTx.signature,
//       th.testToken.address,
//       methodId,
//       encodedParamSets,
//     );

//   console.log("Sending Agg Tx...");
//   const response = await fx.blsExpander.blsCallMultiSameCallerContractFunction(
//     publicKey,
//     nonce,
//     aggTx.signature,
//     th.testToken.address,
//     methodId,
//     encodedParamSets,
//   );
// };

const postNormalTransfer = (
  ctx: GasMeasurementContext,
  measurement: GasMeasurement,
): GasMeasurement => {
  // TODO multiple by transfer count
  return measurement;
};

const createContext = async (
  cfg: GasMeasurementConfig,
  numTransactions: number,
): Promise<GasMeasurementContext> => {
  const rng = new Rng(cfg.seed);
  const fx = await Fixture.create(cfg.numBlsWallets);
  const th = new TokenHelper(fx);
  const blsWallets = await th.walletTokenSetup();

  return {
    th,
    rng,
    blsWallets,
    numTransactions,
  };
};

const getMeasurements = (
  { mode, type }: GasMeasurementTransactionConfig,
  numTransactions: number,
  receipt: ContractReceipt,
): GasMeasurement => {
  return {
    numTransactions,
    transaction: {
      mode,
      type,
      hash: receipt.transactionHash,
    },
    gas: {
      used: receipt.gasUsed.toNumber(),
      price: receipt.effectiveGasPrice.toNumber(),
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
    .map((tc) => tc.type)
    .join(", ");
  console.log(`transaction types: ${transactionTypes}`);
  console.log(`transactions per batch: ${cfg.transactionBatches.join(", ")}`);
  console.log(`# of bls wallets: ${cfg.numBlsWallets}`);
  console.log(`seed: ${cfg.seed}`);
  console.log();

  for (const txnCfg of cfg.transactionConfigs) {
    for (const numTxns of cfg.transactionBatches) {
      console.log(
        `running ${txnCfg.type}, mode ${txnCfg.mode}. # of transactions: ${numTxns}`,
      );

      const ctx = await createContext(cfg, numTxns);

      const txn = await txnCfg.factoryFunc(ctx);
      const receipt = await txn.wait();
      console.warn("???????");
      console.warn(receipt);

      const m = getMeasurements(txnCfg, numTxns, receipt);
      const measurement = txnCfg.postMeasurementFunc
        ? await txnCfg.postMeasurementFunc(ctx, m)
        : m;
      console.warn("!!!!!!!!!!!");
      console.warn(measurement);
    }
  }

  // TODO Write to MD file
  // Store gas results to file if testing on Arbitrum network
  // const shouldSaveResults = [
  //   "arbitrum_testnet",
  //   "arbitrum_testnet_goerli",
  // ].includes(network.name);
  // if (shouldSaveResults) {
  //   console.log("Sending normal token transfer...");
  //   const normalResponse = await th.testToken
  //     .connect(th.fx.signers[0])
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
   * - normal transfer
   * - BLS Wallet bundle transfer
   * - (?) address book trasnfer
   */
  const config: GasMeasurementConfig = {
    seed: "abc123",
    numBlsWallets: 8,
    // transactionBatches: [1, 10, 30, 241 /* max */],
    transactionBatches: [1, 10],
    transactionConfigs: [
      {
        type: "transfer",
        mode: "normal",
        factoryFunc: createNormalTransfer,
        postMeasurementFunc: postNormalTransfer,
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
