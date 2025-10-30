require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-etherscan"); // Asegura la verificación en Etherscan
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20", // ✅ Usa 0.8.20 en lugar de 0.8.27 para mayor compatibilidad con OpenZeppelin
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false, // Desactiva el compilador IR (puede causar problemas con algunos contratos)
    },
  },

  // ✅ Configuración de paths para contratos y tests
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
      // ✅ Configuración para fork de Mainnet (opcional, útil para pruebas avanzadas)
      forking: {
        url: process.env.MAINNET_RPC_URL || "",
        enabled: process.env.FORK_MAINNET === "true" || false,
      },
      // ✅ Cuentas locales con ETH para pruebas
      accounts: {
        mnemonic: "test test test test test test test test test test test junk", // Mnemónico estándar para Hardhat
      },
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/" + process.env.INFURA_KEY,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111, // ✅ ChainId de Sepolia (evita errores de red)
      gasPrice: "auto",  // ✅ Gas price automático (recomendado)
      gas: "auto",       // ✅ Límite de gas automático
    },
    // ✅ Configuración para otras redes (opcional)
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: "auto",
    },
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true" || false, // ✅ Activa solo cuando se necesite
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    showTimeSpent: true,
    showMethodSig: true,
    showGasPrice: true,
    excludeContracts: ["mocks/", "test/"],
    outputFile: "gas-report.txt", // ✅ Guarda el reporte en un archivo
  },

  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "", // ✅ API key específica para Sepolia
      mainnet: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [], // ✅ Para redes personalizadas (ej: Polygon, Arbitrum)
  },

  mocha: {
    timeout: 40000,
    bail: true, // ✅ Detiene las pruebas al primer error (útil para CI)
    reporter: "spec", // ✅ Formato de reporte claro
  },
};
