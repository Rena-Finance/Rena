import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import { HardhatUserConfig } from "hardhat/types";
import "solidity-coverage";
import 'hardhat-deploy';

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [{ version: "0.7.6", 
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
   },
   { version: "0.5.17",
   settings: {
     optimizer: {
       enabled: true,
       runs: 200
     }
   }
  }  
  ],
  },
  // paths: {
  //   sources: "./"
  // }
  networks: {
    hardhat: {
      blockGasLimit: 12500000
    },
  },
};

export default config;