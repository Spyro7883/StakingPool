import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeployStaking", (m) => {
  const tokenA = m.contract("tokenA");
  const tokenB = m.contract("tokenB");
  const staking = m.contract("Staking", [tokenA, tokenB]);
  return { tokenA, tokenB, staking };
});
