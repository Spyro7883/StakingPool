import { expect } from "chai";

import { network } from "hardhat";

async function setupContracts() {
  const { ethers } = await network.connect();

  const [owner] = await ethers.getSigners();

  const TokenA = await ethers.getContractFactory("tokenA");
  const TokenB = await ethers.getContractFactory("tokenB");
  const tokenA = await TokenA.deploy();
  const tokenB = await TokenB.deploy();
  await tokenA.waitForDeployment();
  await tokenB.waitForDeployment();

  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(
    await tokenA.getAddress(),
    await tokenB.getAddress()
  );
  await staking.waitForDeployment();

  return { tokenA, tokenB, staking, owner };
}

describe("Deploy Contracts", () => {
  it("should deploy and mint initial supply", async () => {
    const { networkHelpers } = await network.connect();
    const { tokenA, tokenB, owner } = await networkHelpers.loadFixture(
      setupContracts
    );

    const totalSupplyA = await tokenA.totalSupply();
    const totalSupplyB = await tokenB.totalSupply();
    const ownerBalanceA = await tokenA.balanceOf(owner.address);
    const ownerBalanceB = await tokenB.balanceOf(owner.address);

    expect(totalSupplyA).to.equal(ownerBalanceA);
    expect(totalSupplyB).to.equal(ownerBalanceB);
  });
  it("should deploy the staking contract", async () => {
    const { networkHelpers } = await network.connect();
    const { staking } = await networkHelpers.loadFixture(setupContracts);
    expect(await staking.getAddress()).to.be.a("string");
  });
});

describe("Staking View Functions", () => {
  it("should return the total supply of the staking account", async () => {
    const { networkHelpers } = await network.connect();
    const { staking } = await networkHelpers.loadFixture(setupContracts);
    const totalSupply = await staking.totalSupply();

    expect(totalSupply).to.equal(0n);
  });
  it("should return user's balance", async () => {
    const { networkHelpers } = await network.connect();
    const { staking, owner } = await networkHelpers.loadFixture(setupContracts);
    const balance = await staking.balanceOf(owner.address);

    expect(balance).to.equal(0n);
  });
  it("return rewardRate", async () => {
    const { networkHelpers } = await network.connect();
    const { staking } = await networkHelpers.loadFixture(setupContracts);
    const reward = 57n;

    const rewardRate = await staking.getRewardRate(reward);
    const rewardsDuration = 10n;

    expect(rewardRate).to.equal(reward / rewardsDuration);
  });
  it("return reward for duration", async () => {
    const { networkHelpers } = await network.connect();
    const { staking } = await networkHelpers.loadFixture(setupContracts);

    const rewardRate = await staking.rewardRate();
    const rewardsDuration = await staking.rewardsDuration();

    const rewardForDuration = await staking.getRewardForDuration();

    expect(rewardForDuration).to.equal(rewardRate * rewardsDuration);
  });
});
