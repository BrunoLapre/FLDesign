const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ROLES } = require("./constants");

module.exports = buildModule("ConfigModule", (m) => {
  const tokens = m.useModule(require("./tokens"));
  const rewarder = m.useModule(require("./rewarder"));

  m.call(tokens.flrToken, "grantRole", [ROLES.MINTER_ROLE, rewarder.rewarder]);
  m.call(tokens.modelAccessToken, "grantRole", [ROLES.MINTER_ROLE, rewarder.rewarder]);
  
});