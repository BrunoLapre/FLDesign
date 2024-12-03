const GOVERNANCE_PARAMS = {
    VOTING_DELAY: 1,               // 1 block
    VOTING_PERIOD: 50400,          // ~1 week with 12 sec block time
    QUORUM_PERCENTAGE: 4,          // 4%
  };
  
  const ROLES = {
    MINTER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")),
    ORCHESTRATOR_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ORCHESTRATOR_ROLE")),
    URI_SETTER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("URI_SETTER_ROLE")),
  };
  
  module.exports = {
    GOVERNANCE_PARAMS,
    ROLES,
  };