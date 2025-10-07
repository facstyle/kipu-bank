const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KipuBank", function () {
  let kipuBank, owner, addr1;

  beforeEach(async function () {
    const KipuBank = await ethers.getContractFactory("KipuBank");
    [owner, addr1] = await ethers.getSigners();
    kipuBank = await KipuBank.deploy();
    await kipuBank.deployed();
  });

  it("Permite depositar fondos", async function () {
    const deposit = ethers.parseEther("1.0");
    await kipuBank.connect(addr1).depositar({ value: deposit });

    const balance = await kipuBank.balances(addr1.address);
    expect(balance).to.equal(deposit);
  });

  it("Permite retirar fondos", async function () {
    const deposit = ethers.parseEther("1.0");
    await kipuBank.connect(addr1).depositar({ value: deposit });

    await kipuBank.connect(addr1).retirar(deposit);
    const balanceFinal = await kipuBank.balances(addr1.address);
    expect(balanceFinal).to.equal(0);
  });
});
