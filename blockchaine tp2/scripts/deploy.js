// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  // Configurar parámetros de despliegue
  const bankCap = ethers.parseEther("100"); // Cap global = 100 ETH
  const withdrawalThreshold = ethers.parseEther("1"); // Máx retiro por transacción = 1 ETH

  // Obtener factory del contrato
  const KipuBank = await ethers.getContractFactory("KipuBank");

  console.log("🚀 Desplegando KipuBank...");
  const kipuBank = await KipuBank.deploy(bankCap, withdrawalThreshold);

  // Esperar confirmación
  await kipuBank.waitForDeployment();

  console.log(`✅ KipuBank desplegado en: ${await kipuBank.getAddress()}`);
  console.log(`   Límite global: ${ethers.formatEther(bankCap)} ETH`);
  console.log(`   Límite retiro: ${ethers.formatEther(withdrawalThreshold)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
