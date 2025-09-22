import { expect } from "chai";

import { network } from "hardhat";
import type {
  TokenA__factory,
  TokenB__factory,
  Staking__factory,
} from "../types/ethers-contracts/index.ts";

async function setupContracts() {
  const { ethers } = await network.connect();

  const [owner, otherAccount] = await ethers.getSigners();

  const block = await ethers.provider.getBlock("latest");

  const TokenAFactory = (await ethers.getContractFactory(
    "tokenA"
  )) as TokenA__factory;
  const TokenBFactory = (await ethers.getContractFactory(
    "tokenB"
  )) as TokenB__factory;
  const tokenA = await TokenAFactory.deploy();
  const tokenB = await TokenBFactory.deploy();
  await tokenA.waitForDeployment();
  await tokenB.waitForDeployment();

  const StakingFactory = (await ethers.getContractFactory(
    "Staking"
  )) as Staking__factory;
  const staking = await StakingFactory.deploy(
    await tokenA.getAddress(),
    await tokenB.getAddress()
  );
  await staking.waitForDeployment();

  return { tokenA, tokenB, staking, owner, otherAccount, block };
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
  it("return rewards balance", async () => {
    const { networkHelpers } = await network.connect();
    const { tokenB, staking } = await networkHelpers.loadFixture(
      setupContracts
    );
    const notifyRewards = await staking.notifyRewardsBalanceOf();
    const rewardsToken = await tokenB.balanceOf(staking.getAddress());
    expect(notifyRewards).to.equal(rewardsToken);
  });
  it("revert error, not owner", async () => {
    const { networkHelpers } = await network.connect();
    const { staking, otherAccount } = await networkHelpers.loadFixture(
      setupContracts
    );
    await expect(
      staking.connect(otherAccount).notifyRewardsBalanceOf()
    ).to.be.revertedWith("Not owner");
  });
  it("return last time reward", async () => {
    const { networkHelpers } = await network.connect();
    const { staking, block } = await networkHelpers.loadFixture(setupContracts);
    const periodFinish = await staking.periodFinish();
    const lastTimeReward = await staking.lastTimeRewardApplicable();
    if (!block || block.timestamp === undefined) {
      throw new Error("Block doesn't exist");
    }
    const testReward =
      block.timestamp < periodFinish ? block.timestamp : periodFinish;
    expect(testReward).to.equal(lastTimeReward);
  });
});
