import { expect } from "./deps.ts";

import { ethers, hubbleBls } from "../deps/index.ts";

import * as env from "../src/app/env.ts";
import contractABIs from "../contractABIs/index.ts";
import createBLSWallet from "./helpers/createBLSWallet.ts";
import blsKeyHash from "./helpers/blsKeyHash.ts";

const { BlsSignerFactory } = hubbleBls.signer;

const utils = ethers.utils;

const DOMAIN_HEX = utils.keccak256("0xfeedbee5");
const DOMAIN = utils.arrayify(DOMAIN_HEX);

async function Fixture() {
  const provider = new ethers.providers.JsonRpcProvider();
  const aggregatorSigner = new ethers.Wallet(env.PRIVATE_KEY_AGG, provider);

  if (env.USE_TEST_NET) {
    const originalPopulateTransaction = aggregatorSigner.populateTransaction
      .bind(
        aggregatorSigner,
      );

    aggregatorSigner.populateTransaction = (transaction) => {
      transaction.gasPrice = 0;
      return originalPopulateTransaction(transaction);
    };
  }

  const chainId = (await provider.getNetwork()).chainId;

  const verificationGateway = new ethers.Contract(
    env.VERIFICATION_GATEWAY_ADDRESS,
    contractABIs["VerificationGateway.ovm.json"].abi,
    aggregatorSigner,
  );

  return {
    chainId,
    verificationGateway,
    aggregatorSigner,
  };
}

Deno.test({
  name: "should register new wallet",
  sanitizeOps: false,
  fn: async () => {
    const { chainId, verificationGateway, aggregatorSigner } = await Fixture();

    const blsSigner = (await BlsSignerFactory.new()).getSigner(
      DOMAIN,
      env.PRIVATE_KEY_AGG,
    );

    const walletAddress = await createBLSWallet(
      chainId,
      verificationGateway,
      blsSigner,
    );

    const blsWallet = new ethers.Contract(
      walletAddress,
      contractABIs["BLSWallet.ovm.json"].abi,
      aggregatorSigner,
    );

    expect(
      await blsWallet.publicKeyHash(),
    ).toBe(
      blsKeyHash(blsSigner),
    );
  },
});
