const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Tokens", (m) => {
  // Deploy FLRToken with defaultAdmin and minter addresses
  const flrToken = m.contract("FLRToken", [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // defaultAdmin
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"  // minter
    ]
  );
  const modelAccessToken = m.contract("ModelAccessToken", []);
  return { flrToken, modelAccessToken };
});
