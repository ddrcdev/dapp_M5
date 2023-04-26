require("dotenv") 

module.exports = {
  contracts_build_directory: "./client/src/contracts",
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    dashboard: {
      host: "127.0.0.1",
      port: 24012,
      network_id: "*"
    }, 
    polygon_mumbai_testnet: {
      provider: () => new HDWalletProvider(private_key, process.env.POLYGON_MUMBAI_TESTNET_RPC),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },

  },
  compilers: {
    solc: {
      version: "0.8.19"
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    polygonscan: process.env.POLYGON_APY_KEY,
  },
};
