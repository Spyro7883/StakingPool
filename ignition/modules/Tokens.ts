import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Tokens", (m) => {
  const tokenA = m.contract("tokenA");
  const tokenB = m.contract("tokenB");
  return { tokenA, tokenB };
});
