import { expect } from "chai";

import { network } from "hardhat";
import type {
  TokenA__factory,
  TokenB__factory,
  Staking__factory,
} from "../types/ethers-contracts/index.ts";

async function setupContracts() {
  const { ethers, networkHelpers } = await network.connect();

  const [owner, otherAccount] = await ethers.getSigners();

  const { time } = networkHelpers;

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

  return { tokenA, tokenB, staking, owner, otherAccount, time };
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
    const stakedBalance = await staking.balanceOf(owner.address);

    expect(stakedBalance).to.equal(0n);
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
    const contractRewardBalance = await staking.rewardsBalance();
    const rewardsToken = await tokenB.balanceOf(await staking.getAddress());
    expect(contractRewardBalance).to.equal(rewardsToken);
  });
  it("revert error, not owner", async () => {
    const { networkHelpers } = await network.connect();
    const { staking, otherAccount } = await networkHelpers.loadFixture(
      setupContracts
    );
    await expect(
      staking.connect(otherAccount).rewardsBalance()
    ).to.be.revertedWith("Not owner");
  });
  it("return last time reward", async () => {
    const { networkHelpers } = await network.connect();
    const { staking, time } = await networkHelpers.loadFixture(setupContracts);
    const now = await time.latest();
    const periodFinish = await staking.periodFinish();
    const lastTimeReward = await staking.lastTimeRewardApplicable();
    const testReward = now < periodFinish ? now : periodFinish;
    expect(testReward).to.equal(lastTimeReward);
  });
  it("return reward per token when supply is 0", async () => {
    const { networkHelpers } = await network.connect();
    const { staking } = await networkHelpers.loadFixture(setupContracts);
    const rewardPerToken = await staking.rewardPerToken();
    const storedRewardPerToken = await staking.rewardPerTokenStored();
    expect(storedRewardPerToken).to.equal(rewardPerToken);
  });
  it("return reward per token when supply is not 0", async () => {
    const { networkHelpers } = await network.connect();
    const { staking, tokenA } = await networkHelpers.loadFixture(
      setupContracts
    );
    await tokenA.approve(await staking.getAddress(), 100n);
    await staking.stake(100n);
    const rewardPerToken = await staking.rewardPerToken();
    const currentSupply = await staking.totalSupply();
    const lastApplicableRewardTime = await staking.lastTimeRewardApplicable();
    const lastRewardUpdateTime = await staking.lastUpdateTime();
    const currentRewardRate = await staking.rewardRate();
    let storedRewardPerToken = await staking.rewardPerTokenStored();
    storedRewardPerToken +=
      ((lastApplicableRewardTime - lastRewardUpdateTime) *
        currentRewardRate *
        10n ** 18n) /
      currentSupply;
    expect(storedRewardPerToken).to.equal(rewardPerToken);
  });
  it("reverts when non-owner calls setRewardsDuration", async () => {
    const { networkHelpers } = await network.connect();
    const { staking, otherAccount } = await networkHelpers.loadFixture(
      setupContracts
    );

    await expect(
      staking.connect(otherAccount).setRewardsDuration(99n)
    ).to.be.revertedWith("Not owner");
  });
  it("revert rewards duration, period not finished", async () => {
    const { networkHelpers } = await network.connect();
    const { staking, tokenB, time } = await networkHelpers.loadFixture(
      setupContracts
    );
    const now = await time.latest();
    await tokenB.transfer(await staking.getAddress(), 1_000_000n);
    await staking.notifyRewardAmount(1_000_000n);
    const periodFinish = await staking.periodFinish();
    expect(now < periodFinish).to.equal(true);

    await expect(staking.setRewardsDuration(10n)).to.be.revertedWith(
      "Previous rewards period must be complete before changing the duration for the new period"
    );
  });
  it("set rewards duration", async () => {
    const { networkHelpers } = await network.connect();
    const { staking, tokenB, time } = await networkHelpers.loadFixture(
      setupContracts
    );
    await tokenB.transfer(await staking.getAddress(), 1_000_000n);
    await staking.notifyRewardAmount(1_000_000n);
    const periodFinish = await staking.periodFinish();
    await time.increaseTo(periodFinish + 1n);

    const tx = await staking.setRewardsDuration(42n);
    await expect(tx).to.emit(staking, "RewardsDurationUpdated").withArgs(42n);
    expect(await staking.rewardsDuration()).to.equal(42n);
  });
  it("return earned rewards for the account", async () => {
    const { networkHelpers } = await network.connect();
    const { owner, staking } = await networkHelpers.loadFixture(setupContracts);
    const paidPerToken = await staking.userRewardPerTokenPaid(owner.address);
    const rewardPerTokenNow = await staking.rewardPerToken();
    const stakedBalance = await staking.balanceOf(owner.address);
    const pendingRewards = await staking.rewards(owner.address);
    const contractEarned = await staking.earned(owner.address);
    const calculatedEarned =
      (stakedBalance * (rewardPerTokenNow - paidPerToken)) / 10n ** 18n +
      pendingRewards;
    expect(calculatedEarned).to.equal(contractEarned);
  });
});
