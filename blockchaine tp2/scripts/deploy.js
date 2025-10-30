const hre = require("hardhat"); // ✅ Mejor usar hre para compatibilidad con plugins

async function main() {
  // Configuración de límites (en wei)
  const withdrawalLimit = hre.ethers.parseEther("1"); // 1 ETH por retiro
  const bankCap = hre.ethers.parseEther("50");       // Capacidad total: 50 ETH

  console.log("🚀 Desplegando contrato KipuBank...");

  // Obtener la fábrica del contrato
  const KipuBank = await hre.ethers.getContractFactory("KipuBank");

  // Desplegar el contrato
  const kipuBank = await KipuBank.deploy(withdrawalLimit, bankCap);

  // Esperar a que se confirme el despliegue (mejor práctica)
  await kipuBank.waitForDeployment();

  // Obtener la dirección del contrato desplegado
  const contractAddress = await kipuBank.getAddress();
  console.log("✅ KipuBank desplegado en:", contractAddress);

  // 🔍 Verificación opcional: Mostrar el balance del contrato
  const balance = await hre.ethers.provider.getBalance(contractAddress);
  console.log("💰 Balance inicial del contrato:", hre.ethers.formatEther(balance), "ETH");
}

main().catch((error) => {
  console.error("❌ Error durante el despliegue:", error);
  process.exitCode = 1;
});

