import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

async function deployFixture() {
  const { ethers } = await network.connect();

  const [owner, addr1, addr2] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("TestToken");
  const token = await Token.deploy("1000000000");
  await token.waitForDeployment();
  return { token, owner, addr1, addr2 };
}

describe("Stake (ethers)", function () {
  it("deploys and has totalSupply", async function () {
    const { networkHelpers } = await network.connect();
    const { token } = await networkHelpers.loadFixture(deployFixture);
    const total = await token.totalSupply();
    assert.ok(total > 0n);
  });
});
