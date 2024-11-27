// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces.sol";

contract FLOrchestrator is AccessControl, ITask, IFLorchestrator {
    bytes32 public constant ORCHESTRATOR_ROLE = keccak256("ORCHESTRATOR_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORCHESTRATOR_ROLE, msg.sender);
    }

    // Mapping from task ID to Task struct as storage
    mapping(uint256 => Task) public tasks;
    // Counter for generating unique task IDs
    uint256 private taskIdCounter;

    // Blacklisted addresses and function to add to blacklist
    mapping(address => bool) private blacklist;

    function blacklistAddress(address toBlacklist)
        external 
        onlyRole(DEFAULT_ADMIN_ROLE){
            require(!blacklist[toBlacklist],"Address already Blacklisted");
            blacklist[toBlacklist] = true;
        }
    function removeFromBlacklist(address toUnBlock)
        external
        onlyRole(DEFAULT_ADMIN_ROLE){
            require(blacklist[toUnBlock],"Address not Blacklisted");
            blacklist[toUnBlock] = true;
        }


    // Rewards calculator contract
    IRewardsCalculator public rewardsCalculator;

    // Events
    event TaskCreated(uint256 indexed taskId, address[] initialParticipants);
    event TaskStatusUpdated(uint256 indexed taskId, TaskStatus status);
    event ParticipantAdded(uint256 indexed taskId, address participant);
    event ParticipantRegistered(uint256 indexed taskId, address participant);
    event RoundUpdated(uint256 indexed taskId, uint256 round);
    event RewardsCalculatorUpdated(address indexed newCalculator);

    // Function to generate a new unique task ID
    function _generateTaskId() private returns (uint256) {
        return taskIdCounter++;
    }

    // Modifiers
    modifier taskExists(uint256 taskId) {
        require(tasks[taskId].exists, "Task does not exist");
        _;
    }
    modifier taskNotStarted(uint256 taskId) {
        require(tasks[taskId].status == TaskStatus.PROPOSED, "Task must be in PROPOSED state");
        _;
    }
    modifier onlyStartedTask(uint256 taskId) {
        require(tasks[taskId].status == TaskStatus.STARTED, "Task must be in STARTED state");
        _;
    }
    modifier onlyFinished(uint256 taskId) {
        require(tasks[taskId].status == TaskStatus.FINISHED, "Task must be in FINISHED state");
        _;
    }
    // Function to set or update the rewards calculator contract address
    function setRewardsCalculator(address calculatorAddress) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(calculatorAddress != address(0), "Invalid calculator address");
        rewardsCalculator = IRewardsCalculator(calculatorAddress);
        emit RewardsCalculatorUpdated(calculatorAddress);
    }

    // Function to propose a new task with initial participants
    function proposeTask(address[] calldata initialParticipants, uint256 rewardPool, uint256 initialAccessTokens) 
        external 
        onlyRole(ORCHESTRATOR_ROLE) 
        returns (uint256) 
    {
        uint256 newTaskId = _generateTaskId();
        
        // Remove duplicate addresses while preserving order
        address[] memory uniqueParticipants = _getUniqueAddresses(initialParticipants);
        
        tasks[newTaskId] = Task({
            id: newTaskId,
            status: TaskStatus.PROPOSED,
            currentRound: 0,
            participants: uniqueParticipants,
            exists: true,
            flrTokenPool: rewardPool,
            modelTokenAmount: initialAccessTokens
        });

        emit TaskCreated(newTaskId, uniqueParticipants);
        emit TaskStatusUpdated(newTaskId, TaskStatus.PROPOSED);
        
        return newTaskId;
    }

    // Function to progress to next round
    function progressToNextRound(uint256 taskId) 
        external 
        onlyRole(ORCHESTRATOR_ROLE)
        taskExists(taskId)
        onlyStartedTask(taskId)
    {
        Task storage task = tasks[taskId];
        task.currentRound++;
        emit RoundUpdated(taskId, task.currentRound);
    }

    // Function to finish a task and trigger rewards calculation
    function finishTask(uint256 taskId, uint256[] calldata finalScores) 
        external 
        onlyRole(ORCHESTRATOR_ROLE)
        taskExists(taskId)
        onlyStartedTask(taskId)
    {
        Task storage task = tasks[taskId];
        
        // Update status
        task.status = TaskStatus.FINISHED;
        emit TaskStatusUpdated(taskId, TaskStatus.FINISHED);
        
        // Calculate rewards if calculator is set
        if (address(rewardsCalculator) != address(0)) {
            rewardsCalculator.calculateRewards(taskId, task.participants, finalScores, task.flrTokenPool, task.modelTokenAmount);
        }
    }
    // use to set to paid state 
    function setPayable(uint256 taskId)
        external 
        onlyRole(ORCHESTRATOR_ROLE)
        taskExists(taskId)
        onlyFinished(taskId)
    {
        Task storage task = tasks[taskId];
        
        // Update status
        task.status = TaskStatus.PAID;
        emit TaskStatusUpdated(taskId, TaskStatus.PAID);
        
    }    

    // Internal function to remove duplicate addresses while preserving order
   function _getUniqueAddresses(address[] calldata addresses) 
    internal 
    pure 
    returns (address[] memory) 
{
    if (addresses.length == 0) return new address[](0);
    
    // First, create a memory array to store unique addresses
    address[] memory uniqueAddresses = new address[](addresses.length);
    uint256 uniqueCount = 0;
    
    // For each address, check if we've seen it before
    for (uint256 i = 0; i < addresses.length; i++) {
        address currentAddress = addresses[i];
        
        // Skip zero addresses
        if (currentAddress == address(0)) continue;
        
        // Check if address is already in uniqueAddresses
        bool isDuplicate = false;
        for (uint256 j = 0; j < uniqueCount; j++) {
            if (uniqueAddresses[j] == currentAddress) {
                isDuplicate = true;
                break;
            }
        }
        
        // If not a duplicate, add it
        if (!isDuplicate) {
            uniqueAddresses[uniqueCount] = currentAddress;
            uniqueCount++;
        }
    }
    
    // Create final array with correct size
    address[] memory result = new address[](uniqueCount);
    for (uint256 i = 0; i < uniqueCount; i++) {
        result[i] = uniqueAddresses[i];
    }
    
    return result;
}

    // Function to allow participants to self-register for a task
    function registerForTask(uint256 taskId)
        external
        taskExists(taskId)
        taskNotStarted(taskId)
    {
        require(!isParticipant(taskId, msg.sender), "Already registered for this task");
        require(msg.sender != address(0), "Invalid participant address");
        require(!blacklist[msg.sender], "Address is blacklisted");

        tasks[taskId].participants.push(msg.sender);
        emit ParticipantRegistered(taskId, msg.sender);
    }

    // Function to start a task - only callable by ORCHESTRATOR_ROLE
    function startTask(uint256 taskId) 
        external 
        onlyRole(ORCHESTRATOR_ROLE)
        taskExists(taskId)
        taskNotStarted(taskId)
    {
        Task storage task = tasks[taskId];
        require(task.participants.length > 0, "Task must have at least one participant");
        //maybe send it to the rewarder already
        task.status = TaskStatus.STARTED;
        emit TaskStatusUpdated(taskId, TaskStatus.STARTED);
    }

    // Function to get all participants for a task
    function getParticipants(uint256 taskId)
        external
        view
        taskExists(taskId)
        returns (address[] memory)
    {
        return tasks[taskId].participants;
    }


    // Basic getter for task info
    function getTask(uint256 taskId) 
        external 
        view
        taskExists(taskId)
        returns (
            TaskStatus status,
            uint256 currentRound,
            address[] memory participants
        ) 
    {
        Task storage task = tasks[taskId];
        return (task.status, task.currentRound, task.participants);
    }

    // Function to check if an address is a participant in a task
    function isParticipant(uint256 taskId, address participant) 
        public 
        view 
        taskExists(taskId) 
        returns (bool) 
    {
        address[] storage participants = tasks[taskId].participants;
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i] == participant) {
                return true;
            }
        }
        return false;
    }
        // Function to get current round
    function getCurrentRound(uint256 taskId) 
        external 
        view 
        taskExists(taskId) 
        returns (uint256) 
    {
        return tasks[taskId].currentRound;
    }

    // Function to get task status
    function getTaskStatus(uint256 taskId) 
        external 
        view 
        taskExists(taskId) 
        returns (TaskStatus) 
    {
        return tasks[taskId].status;
    }
}