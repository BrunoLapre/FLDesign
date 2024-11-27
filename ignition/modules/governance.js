const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Governance", (m) => {
  const tokens = m.useModule(require("./tokens"));
  const orchestrator = m.useModule(require("./orchestrator"));

  const VOTING_DELAY = 1;
  const VOTING_PERIOD = 50400;
  const QUORUM_PERCENTAGE = 4;

  const governance = m.contract("FLGovernor", [
      tokens.flrToken
    ]
  );

  return { governance };
});