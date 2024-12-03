// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import "./interfaces.sol";

contract FLRewarder is AccessControl, ITask, IRewardsCalculator {
    bytes32 public constant ORCHESTRATOR_ROLE = keccak256("ORCHESTRATOR_ROLE");
    bytes32 public constant CONTRIBUTOR_ROLE = keccak256("CONTRIBUTOR_ROLE");
    
    // Token contracts
    IFLRToken public immutable flrToken;
    IModelAccessToken public immutable modelAccessToken;
    IFLorchestrator public immutable orchestrator;
    
    // Struct to track participant contributions
    struct ParticipantScore {
        mapping(uint256 => uint256) roundScores;  // round -> score
        uint256 totalScore;
        bool hasContributed;
    }
    
    // Struct to track model access token details
    struct ModelTokenInfo {
        uint256 taskId;
        uint256 participantCount;
        uint256 totalRounds;
        uint256 finalAccuracy;
    }
    
    // Struct to track task rewards
    struct TaskRewards {
        mapping(address => ParticipantScore) participantScores;
        uint256 totalTaskScore;
        bool isFinalized;
        uint256 rewardTokenPool;
        uint256 modelTokenAmount;
        ModelTokenInfo modelInfo;
        mapping(address => bool) hasClaimedReward;
    }

    // Main storage
    mapping(uint256 => TaskRewards) public taskRewards;

    mapping(uint256 => Task) private activeTasks;

    // Events
    event RoundScoreRecorded(uint256 indexed taskId, uint256 indexed round, address participant, uint256 score);
    event TaskScoreFinalized(uint256 indexed taskId, address participant, uint256 totalScore);
    event RewardsClaimed(
        uint256 indexed taskId, 
        address participant, 
        uint256 flrTokenAmount, 
        uint256 modelTokenAmount
    );
    event ModelInfoSet(
        uint256 indexed taskId,
        uint256 participantCount,
        uint256 totalRounds,
        uint256 finalAccuracy
    );

    constructor(
        address _flrToken,
        address _modelAccessToken,
        address _orchestrator
    ) {
        flrToken = IFLRToken(_flrToken);
        modelAccessToken = IModelAccessToken(_modelAccessToken);
        orchestrator = IFLorchestrator(_orchestrator);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONTRIBUTOR_ROLE, msg.sender);
    }

    // Set model info for a task
    function setModelInfo(
        uint256 taskId,
        uint256 participantCount,
        uint256 totalRounds,
        uint256 finalAccuracy
    ) 
        external 
        onlyRole(CONTRIBUTOR_ROLE) 
    {
        TaskRewards storage task = taskRewards[taskId];
        
        task.modelInfo = ModelTokenInfo({
            taskId: taskId,
            participantCount: participantCount,
            totalRounds: totalRounds,
            finalAccuracy: finalAccuracy
        });

        emit ModelInfoSet(
            taskId,
            participantCount,
            totalRounds,
            finalAccuracy
        );
    }

    // Record round scores
    function recordRoundScores(
        uint256 taskId,
        uint256 round,
        address[] calldata participants,
        uint256[] calldata scores
    ) 
        external 
        onlyRole(CONTRIBUTOR_ROLE)
    {
        require(!taskRewards[taskId].isFinalized, "Task already finalized");
        require(participants.length == scores.length, "Array lengths mismatch");
        
        TaskRewards storage task = taskRewards[taskId];
        
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            require(orchestrator.isParticipant(taskId, participant), "Invalid participant");
            
            uint256 score = scores[i];
            ParticipantScore storage pScore = task.participantScores[participant];
            
            pScore.roundScores[round] = score;
            pScore.hasContributed = true;
            
            emit RoundScoreRecorded(taskId, round, participant, score);
        }
    }

    // Finalize task scores by the external system with all scores
    function calculateRewards(
        uint256 taskId,
        address[] calldata participants,
        uint256[] calldata finalScores,
        uint256 flrTokenPool,
        uint256 modelTokenAmount
    ) 
        external 
        onlyRole(CONTRIBUTOR_ROLE)
    {
        require(!taskRewards[taskId].isFinalized, "Task already finalized");
        require(participants.length == finalScores.length, "Array lengths mismatch");
        
        TaskRewards storage task = taskRewards[taskId];
        task.rewardTokenPool = flrTokenPool;
        task.modelTokenAmount = modelTokenAmount;
        
        uint256 totalScore = 0;
        
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            require(orchestrator.isParticipant(taskId, participant), "Invalid participant");
            
            uint256 finalScore = finalScores[i];
            ParticipantScore storage pScore = task.participantScores[participant];
            
            pScore.totalScore = finalScore;
            totalScore += finalScore;
            
            emit TaskScoreFinalized(taskId, participant, finalScore);
        }
        
        task.totalTaskScore = totalScore;
        task.isFinalized = true;
    }

    // Claim rewards
    function claimRewards(uint256 taskId) external {
        TaskRewards storage task = taskRewards[taskId];
        require(task.isFinalized, "Task not finalized");
        require(!task.hasClaimedReward[msg.sender], "Rewards already claimed");
        require(orchestrator.isParticipant(taskId, msg.sender), "Not a participant");
        

        ParticipantScore storage pScore = task.participantScores[msg.sender];
        require(pScore.hasContributed, "No contribution recorded");
        
        require(task.rewardTokenPool > 0, "No Token Pool");
        require(pScore.totalScore > 0, "no Pscore");
        require(task.totalTaskScore > 0, "No total score");
        // Calculate FLR token reward based on contribution proportion
        uint256 flrTokenAmount = (task.rewardTokenPool * pScore.totalScore) / task.totalTaskScore;
        
        // Mark as claimed and distribute rewards
        task.hasClaimedReward[msg.sender] = true;
        
        // Mint both tokens
        try flrToken.mint(msg.sender, flrTokenAmount){}
        catch Error(string memory errMessage){revert(errMessage);}
    
        try modelAccessToken.mint(msg.sender, taskId, task.modelTokenAmount, ""){}
        catch Error(string memory errMessage){ revert(errMessage);}
        
        emit RewardsClaimed(taskId, msg.sender, flrTokenAmount, task.modelTokenAmount);
    }

    // View functions
    function getModelInfo(uint256 taskId) external view returns (ModelTokenInfo memory) {
        return taskRewards[taskId].modelInfo;
    }

    function getRoundScore(uint256 taskId, address participant, uint256 round) 
        external 
        view 
        returns (uint256) 
    {
        return taskRewards[taskId].participantScores[participant].roundScores[round];
    }

    function getFinalScore(uint256 taskId, address participant) 
        external 
        view 
        returns (uint256) 
    {
        return taskRewards[taskId].participantScores[participant].totalScore;
    }
}