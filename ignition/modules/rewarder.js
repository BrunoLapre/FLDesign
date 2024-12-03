const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Rewarder", (m) => {
  const tokens = m.useModule(require("./tokens"));
  const orchestrator = m.useModule(require("./orchestrator"));

  const rewarder = m.contract("FLRewarder",
     [
      tokens.flrToken,
      tokens.modelAccessToken,
      orchestrator.orchestrator
    ]
  );

  return { rewarder };
});