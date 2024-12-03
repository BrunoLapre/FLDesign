const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const roleAssignment = require("./roleAssignment");

module.exports = buildModule("Main", (m) => {
  const tokens = m.useModule(require("./tokens"));
  const orchestrator = m.useModule(require("./orchestrator"));
  const rewarder = m.useModule(require("./rewarder"));
  const governance = m.useModule(require("./governance"));

  const roleAssignments = m.useModule(require("./roleAssignment"), {
    after: [tokens, orchestrator, rewarder, governance]
  });

  return {
    tokens,
    orchestrator,
    rewarder,
    governance,
    roleAssignment
  };
});