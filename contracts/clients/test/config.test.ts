import { expect } from "chai";
import {
  UnvalidatedMultiNetworkConfig,
  getMultiConfig,
} from "../src/MultiNetworkConfig";

const getValue = (networkKey: string, propName: string) =>
  `${networkKey}-${propName}`;

const getSingleConfig = (networkKey: string) => ({
  parameters: {},
  addresses: {
    create2Deployer: getValue(networkKey, "create2Deployer"),
    precompileCostEstimator: getValue(networkKey, "precompileCostEstimator"),
    verificationGateway: getValue(networkKey, "verificationGateway"),
    blsLibrary: getValue(networkKey, "blsLibrary"),
    blsExpander: getValue(networkKey, "blsExpander"),
    utilities: getValue(networkKey, "utilities"),
    testToken: getValue(networkKey, "testToken"),
  },
  auxiliary: {
    chainid: 123,
    domain: getValue(networkKey, "domain"),
    genesisBlock: 456,
    deployedBy: getValue(networkKey, "deployedBy"),
    version: getValue(networkKey, "version"),
  },
});

const network1 = "network1";
const network2 = "network2";

describe("MultiNetworkConfig", () => {
  let validConfig: UnvalidatedMultiNetworkConfig;

  beforeEach(() => {
    validConfig = {
      [network1]: getSingleConfig(network1),
      [network2]: getSingleConfig(network2),
    };
  });

  describe("getMultiConfig", () => {
    it("suceeds with valid config", async () => {
      await expect(
        getMultiConfig("", async () => JSON.stringify(validConfig)),
      ).to.eventually.deep.equal(validConfig);
    });

    it("fails if config is not json", async () => {
      await expect(getMultiConfig("", async () => "")).to.eventually.be
        .rejected;
    });

    it("fails if config is empty", async () => {
      await expect(getMultiConfig("", async () => "{}")).to.eventually.be
        .rejected;
    });

    it(`fails if ${network1}.addresses.verificationGateway is removed`, async () => {
      delete validConfig[network1].addresses.verificationGateway;

      await expect(getMultiConfig("", async () => JSON.stringify(validConfig)))
        .to.eventually.be.rejected;
    });

    it(`fails if ${network2}.auxiliary is removed`, async () => {
      delete validConfig[network1].auxiliary;

      await expect(getMultiConfig("", async () => JSON.stringify(validConfig)))
        .to.eventually.be.rejected;
    });

    it(`fails if ${network1}.addresses.blsLibrary is set to a number`, async () => {
      validConfig[network1].addresses.blsLibrary = 1337;

      await expect(getMultiConfig("", async () => JSON.stringify(validConfig)))
        .to.eventually.be.rejected;
    });

    it(`fails if ${network2}.auxiliary.chainid is set to a string`, async () => {
      validConfig[network1].auxiliary.chainid = "off-the-chain";

      await expect(getMultiConfig("", async () => JSON.stringify(validConfig)))
        .to.eventually.be.rejected;
    });
  });
});
