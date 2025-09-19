import type { HardhatUserConfig } from "hardhat/config";

import { configVariable } from "hardhat/config";

import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import hardhatKeystore from "@nomicfoundation/hardhat-keystore";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";

const config: HardhatUserConfig = {
  plugins: [hardhatEthers, hardhatKeystore, hardhatNetworkHelpers],
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
