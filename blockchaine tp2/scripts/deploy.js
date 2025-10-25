// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const withdrawalLimit = hre.ethers.parseEther("1"); // 1 ETH por retiro
  const bankCap = hre.ethers.parseEther("100"); // Máximo 100 ETH en el banco

  console.log("Desplegando KipuBank...");

  const KipuBank = await hre.ethers.getContractFactory("KipuBank");
  const kipuBank = await KipuBank.deploy(withdrawalLimit, bankCap);

  await kipuBank.waitForDeployment();

  console.log(`✅ KipuBank desplegado en: ${kipuBank.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


