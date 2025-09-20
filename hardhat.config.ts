import type { HardhatUserConfig } from "hardhat/config";

import { configVariable } from "hardhat/config";

import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatEthersChai from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatKeystore from "@nomicfoundation/hardhat-keystore";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

const config: HardhatUserConfig = {
  plugins: [
    hardhatMocha,
    hardhatEthers,
    hardhatEthersChai,
    hardhatKeystore,
    hardhatNetworkHelpers,
    hardhatVerify,
  ],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
};

export default config;
