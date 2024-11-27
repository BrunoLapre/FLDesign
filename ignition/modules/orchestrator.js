const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Orchestrator", (m) => {
  const tokens = m.useModule(require("./tokens"));
  const orchestrator = m.contract("FLOrchestrator");

  return { orchestrator };
});
