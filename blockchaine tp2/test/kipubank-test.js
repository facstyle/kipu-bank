// test/kipubank-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KipuBank", function () {
  let kipuBank, owner, user;

  beforeEach(async function () {
    const KipuBank = await ethers.getContractFactory("KipuBank");
    [owner, user] = await ethers.getSigners();
    kipuBank = await KipuBank.deploy(
      ethers.parseEther("1"),  // límite de retiro
      ethers.parseEther("100") // capacidad total
    );
    await kipuBank.waitForDeployment();
  });

  it("Permite depositar fondos", async function () {
    const deposit = ethers.parseEther("1.0");
    await kipuBank.connect(user).deposit({ value: deposit });

    const balance = await kipuBank.getBalance(user.address);
    expect(balance).to.equal(deposit);
  });

  it("Permite retirar fondos", async function () {
    const deposit = ethers.parseEther("1.0");
    await kipuBank.connect(user).deposit({ value: deposit });

    await kipuBank.connect(user).withdraw(ethers.parseEther("0.5"));
    const balance = await kipuBank.getBalance(user.address);

    expect(balance).to.equal(ethers.parseEther("0.5"));
  });

  it("Rechaza retiro que excede el límite", async function () {
    const deposit = ethers.parseEther("2.0");
    await kipuBank.connect(user).deposit({ value: deposit });

    await expect(
      kipuBank.connect(user).withdraw(ethers.parseEther("2.0"))
    ).to.be.revertedWithCustomError(kipuBank, "ErrOverWithdrawalLimit");
  });
});
