// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface ITask {
    enum TaskStatus {
        PROPOSED,
        STARTED,
        FINISHED,
        PAID
    }
    struct Task {
        uint256 id;
        TaskStatus status;
        uint256 currentRound;
        address[] participants;
        bool exists;
        uint256 flrTokenPool;
        uint256 modelTokenAmount;
    }
    
}

interface IRewardsCalculator {
    function calculateRewards(        uint256 taskId,
        address[] calldata participants,
        uint256[] calldata finalScores,
        uint256 flrTokenPool,
        uint256 modelTokenAmount) external;
}
interface IFLorchestrator is ITask {
    function getTask(uint256 taskId) external view returns  (
        TaskStatus status,
        uint256 currentRound,
        address[] memory participants
    );
    function isParticipant(uint256 taskId, address participant) external view returns (bool);
}

interface IFLRToken {
    function mint(address to, uint256 amount) external;
}

interface IModelAccessToken {
    function mint(address to, uint256 id, uint256 amount, bytes calldata data) external;
}