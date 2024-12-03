const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Main", (m) => {
  const tokens = m.useModule(require("./tokens"));
  const orchestrator = m.useModule(require("./orchestrator"));
  const rewarder = m.useModule(require("./rewarder"));
  const governance = m.useModule(require("./governance"));

  return {
    tokens,
    orchestrator,
    rewarder,
    governance
  };
});