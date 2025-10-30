const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("⛽ KipuBank - Tests con medición de gas y cobertura", function () {
  let kipuBank;
  let owner, user1, user2;
  const withdrawalLimit = ethers.parseEther("1");
  const bankCap = ethers.parseEther("50");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const KipuBank = await ethers.getContractFactory("KipuBank");
    kipuBank = await KipuBank.deploy(withdrawalLimit, bankCap);
    await kipuBank.waitForDeployment();
  });

  /*//////////////////////////////////////////////////////////////
                            🚀 DESPLIEGUE
  //////////////////////////////////////////////////////////////*/
  describe("Despliegue", function () {
    it("debería desplegar correctamente con los parámetros iniciales", async function () {
      expect(await kipuBank.owner()).to.equal(owner.address);
      expect(await kipuBank.withdrawalLimit()).to.equal(withdrawalLimit);
      expect(await kipuBank.bankCap()).to.equal(bankCap);
    });

    it("debería desplegarse con un costo de gas razonable", async function () {
      const KipuBank = await ethers.getContractFactory("KipuBank");
      const deploymentTx = await KipuBank.deploy(withdrawalLimit, bankCap);
      const receipt = await deploymentTx.waitForDeployment();

      // Obtener el receipt completo para calcular el gas usado
      const deployReceipt = await deploymentTx.deploymentTransaction().wait();
      console.log(`⛽ Gas usado en despliegue: ${deployReceipt.gasUsed.toString()}`);

      // Verificar que el gas usado no sea excesivo (ajusta según tu contrato)
      expect(deployReceipt.gasUsed).to.be.lessThan(2000000); // Límite razonable para despliegue
    });
  });

  /*//////////////////////////////////////////////////////////////
                            💰 DEPÓSITOS
  //////////////////////////////////////////////////////////////*/
  describe("Depósitos", function () {
    it("permite depositar ETH y mide el gas", async function () {
      const amount = ethers.parseEther("0.5");
      const tx = await kipuBank.connect(user1).deposit({ value: amount });
      const receipt = await tx.wait();

      console.log(`⛽ Gas usado en depósito: ${receipt.gasUsed.toString()}`);

      // Verificar que el gas usado sea razonable
      expect(receipt.gasUsed).to.be.lessThan(100000); // Ajusta según tus expectativas

      const balance = await kipuBank.getBalance(user1.address);
      expect(balance).to.equal(amount);
    });

    it("revierta si el depósito es de 0 ETH", async function () {
      await expect(
        kipuBank.connect(user1).deposit({ value: 0 })
      ).to.be.revertedWithCustomError(kipuBank, "ErrZeroAmount");
    });

    it("revierta si el depósito supera bankCap", async function () {
      // Deposita casi todo el bankCap
      await kipuBank.connect(user1).deposit({ value: bankCap - ethers.parseEther("0.1") });

      // Intenta depositar más de lo permitido
      const tx = kipuBank.connect(user2).deposit({ value: ethers.parseEther("0.2") });
      await expect(tx).to.be.revertedWithCustomError(kipuBank, "ErrBankCapReached");
    });

    it("debería emitir evento Deposit al depositar", async function () {
      const amount = ethers.parseEther("0.5");
      await expect(kipuBank.connect(user1).deposit({ value: amount }))
        .to.emit(kipuBank, "Deposit")
        .withArgs(user1.address, amount);
    });

    it("debería incrementar el contador de depósitos", async function () {
      const initialCount = await kipuBank.getDepositCount();
      await kipuBank.connect(user1).deposit({ value: ethers.parseEther("0.5") });
      expect(await kipuBank.getDepositCount()).to.equal(initialCount + 1);
    });
  });

  /*//////////////////////////////////////////////////////////////
                            💸 RETIROS
  //////////////////////////////////////////////////////////////*/
  describe("Retiros", function () {
    beforeEach(async function () {
      // Deposita 1 ETH antes de cada prueba de retiro
      await kipuBank.connect(user1).deposit({ value: ethers.parseEther("1") });
    });

    it("permite retirar ETH y mide el gas", async function () {
      const withdrawAmount = ethers.parseEther("0.5");
      const tx = await kipuBank.connect(user1).withdraw(withdrawAmount);
      const receipt = await tx.wait();

      console.log(`⛽ Gas usado en retiro: ${receipt.gasUsed.toString()}`);

      // Verificar que el gas usado sea razonable
      expect(receipt.gasUsed).to.be.lessThan(120000); // Ajusta según tus expectativas

      const balance = await kipuBank.getBalance(user1.address);
      expect(balance).to.equal(ethers.parseEther("0.5")); // 1 ETH - 0.5 ETH
    });

    it("permite retirar TODO el balance con withdrawAll y mide el gas", async function () {
      const tx = await kipuBank.connect(user1).withdrawAll();
      const receipt = await tx.wait();

      console.log(`⛽ Gas usado en withdrawAll: ${receipt.gasUsed.toString()}`);

      const balance = await kipuBank.getBalance(user1.address);
      expect(balance).to.equal(0);
    });

    it("revierta si el retiro excede el límite", async function () {
      await expect(
        kipuBank.connect(user1).withdraw(ethers.parseEther("1.1")) // > withdrawalLimit (1 ETH)
      ).to.be.revertedWithCustomError(kipuBank, "ErrOverWithdrawalLimit");
    });

    it("revierta si el usuario intenta retirar más de su balance", async function () {
      await expect(
        kipuBank.connect(user1).withdraw(ethers.parseEther("2"))
      ).to.be.revertedWithCustomError(kipuBank, "ErrInsufficientBalance");
    });

    it("revierta si el retiro es de 0 ETH", async function () {
      await expect(
        kipuBank.connect(user1).withdraw(0)
      ).to.be.revertedWithCustomError(kipuBank, "ErrZeroAmount");
    });

    it("debería emitir evento Withdrawal al retirar", async function () {
      const withdrawAmount = ethers.parseEther("0.5");
      await expect(kipuBank.connect(user1).withdraw(withdrawAmount))
        .to.emit(kipuBank, "Withdrawal")
        .withArgs(user1.address, withdrawAmount);
    });

    it("debería incrementar el contador de retiros", async function () {
      const initialCount = await kipuBank.getWithdrawalCount();
      await kipuBank.connect(user1).withdraw(ethers.parseEther("0.5"));
      expect(await kipuBank.getWithdrawalCount()).to.equal(initialCount + 1);
    });
  });

  /*//////////////////////////////////////////////////////////////
                            🧾 CONTADORES
  //////////////////////////////////////////////////////////////*/
  describe("Contadores", function () {
    it("debería incrementar los contadores correctamente", async function () {
      const initialDepositCount = await kipuBank.getDepositCount();
      const initialWithdrawalCount = await kipuBank.getWithdrawalCount();

      // Deposita y retira
      await kipuBank.connect(user1).deposit({ value: ethers.parseEther("1") });
      await kipuBank.connect(user1).withdraw(ethers.parseEther("0.5"));

      expect(await kipuBank.getDepositCount()).to.equal(initialDepositCount + 1);
      expect(await kipuBank.getWithdrawalCount()).to.equal(initialWithdrawalCount + 1);
    });

    it("debería manejar múltiples operaciones sin desbordar contadores", async function () {
      for (let i = 0; i < 10; i++) {
        await kipuBank.connect(user1).deposit({ value: ethers.parseEther("0.1") });
        await kipuBank.connect(user1).withdraw(ethers.parseEther("0.05"));
      }

      expect(await kipuBank.getDepositCount()).to.equal(10);
      expect(await kipuBank.getWithdrawalCount()).to.equal(10);
    });
  });

  /*//////////////////////////////////////////////////////////////
                            🔒 FUNCIONES DE OWNER
  //////////////////////////////////////////////////////////////*/
  describe("Funciones de Owner", function () {
    it("solo el owner puede llamar a recoverETH", async function () {
      await expect(
        kipuBank.connect(user1).recoverETH(ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(kipuBank, "ErrInvalidOwner");
    });

    it("el owner puede recuperar ETH del contrato", async function () {
      // Envía ETH directamente al contrato (simulando un error)
      await owner.sendTransaction({
        to: await kipuBank.getAddress(),
        value: ethers.parseEther("1"),
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      const tx = await kipuBank.connect(owner).recoverETH(ethers.parseEther("1"));
      const receipt = await tx.wait();

      console.log(`⛽ Gas usado en recoverETH: ${receipt.gasUsed.toString()}`);

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  /*//////////////////////////////////////////////////////////////
                            🛡️ SEGURIDAD
  //////////////////////////////////////////////////////////////*/
  describe("Seguridad", function () {
    it("debería prevenir reentrancy attacks", async function () {
      // Despliega un contrato malicioso que intenta reentrar
      const Attacker = await ethers.getContractFactory("Attacker");
      const attacker = await Attacker.deploy(await kipuBank.getAddress());
      await attacker.waitForDeployment();

      // Intenta explotar el contrato
      await expect(
        attacker.connect(user1).attack({ value: ethers.parseEther("1") })
      ).to.be.reverted; // Debería fallar debido a ReentrancyGuard
    });
  });
});
