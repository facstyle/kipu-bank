// test/kipubank-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KipuBank", function () {
  let KipuBank, kipuBank, owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const bankCap = ethers.parseEther("10");
    const withdrawalThreshold = ethers.parseEther("1");

    KipuBank = await ethers.getContractFactory("KipuBank");
    kipuBank = await KipuBank.deploy(bankCap, withdrawalThreshold);
    await kipuBank.waitForDeployment();
  });

  it("Debe permitir depositar ETH", async function () {
    await kipuBank.connect(user1).deposit({ value: ethers.parseEther("1") });
    const balance = await kipuBank.vaultOf(user1.address);
    expect(balance).to.equal(ethers.parseEther("1"));
  });

  it("Debe permitir retirar ETH dentro del límite", async function () {
    await kipuBank.connect(user1).deposit({ value: ethers.parseEther("2") });

    await kipuBank.connect(user1).withdraw(ethers.parseEther("1"));
    const balance = await kipuBank.vaultOf(user1.address);

    expect(balance).to.equal(ethers.parseEther("1"));
  });

  it("Debe revertir si el retiro excede el threshold", async function () {
    await kipuBank.connect(user1).deposit({ value: ethers.parseEther("2") });

    await expect(
      kipuBank.connect(user1).withdraw(ethers.parseEther("2"))
    ).to.be.revertedWithCustomError(kipuBank, "Err_ThresholdExceeded");
  });

  it("Debe incrementar el contador de depósitos", async function () {
    await kipuBank.connect(user1).deposit({ value: ethers.parseEther("1") });
    const count = await kipuBank.globalDepositCount();
    expect(count).to.equal(1);
  });
});
