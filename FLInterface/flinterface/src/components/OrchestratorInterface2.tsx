import React, { useState } from 'react';
import { ethers, Contract } from 'ethers';
import {ORCHESTRATOR_ABI} from './abis/OrchestratorAbi';
import deployedAddresses from './Addresses.json';
declare let window: any;

const ORCHESTRATOR_ADDRESS = deployedAddresses['Orchestrator#FLOrchestrator'];

// translate status to strings
const getStatusString = (statusCode: number): string => {
  switch (statusCode) {
      case 0:
          return "PROPOSED";
      case 1:
          return "ACTIVE";
      case 2:
          return "FINISHED";
      case 3:
          return "PAID OUT";
      default:
          return "UNKNOWN";
  }
};

const OrchestratorInterface = () => {
  const [participants, setParticipants] = useState('');
  const [rewardPool, setRewardPool] = useState('');
  const [initialTokens, setInitialTokens] = useState('');
  const [status, setStatus] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [queryTaskId, setQueryTaskId] = useState('');
  const [addressToBlacklist, setAddressToBlacklist] = useState('');
  const [participantScores, setParticipantScores] = useState<{[address: string]: string}>({});
  const [addressToUnblock, setAddressToUnblock] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [taskDetails, setTaskDetails] = useState<{
    status: string;
    currentRound: number;
    participants: string[];
  } | null>(null);

  const onClickConnect = () => {
    if(!window.ethereum) {
      console.log("please install MetaMask");
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    // MetaMask requires requesting permission to connect users accounts
    provider.send("eth_requestAccounts", [])
    .then((accounts)=>{
      if(accounts.length>0) setCurrentAccount(accounts[0])
    })
    .catch((e)=>console.log(e))
};

  const handleRegisterForTask = async (taskId: string) => {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
            ORCHESTRATOR_ADDRESS,
            ORCHESTRATOR_ABI,
            signer
        );

        setStatus('Registering for task...');
        const tx = await contract.registerForTask(taskId);
        await tx.wait();
        setStatus('Registered for task successfully');
        
        // Refresh task details
        handleGetTask();
    } catch (e) {
        setStatus(`Error registering for task: ${e}`);
    }
};

const handleBlacklist = async () => {
    try {
        if (!ethers.isAddress(addressToBlacklist)) {
            throw new Error('Invalid address format');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
            ORCHESTRATOR_ADDRESS,
            ORCHESTRATOR_ABI,
            signer
        );

        setStatus('Blacklisting address...');
        const tx = await contract.blacklistAddress(addressToBlacklist);
        await tx.wait();
        setStatus('Address blacklisted successfully');
        setAddressToBlacklist('');
    } catch (e) {
        setStatus(`Error blacklisting address: ${e}`);
    }
};

const handleUnblock = async () => {
    try {
        if (!ethers.isAddress(addressToUnblock)) {
            throw new Error('Invalid address format');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
            ORCHESTRATOR_ADDRESS,
            ORCHESTRATOR_ABI,
            signer
        );

        setStatus('Removing address from blacklist...');
        const tx = await contract.removeFromBlacklist(addressToUnblock);
        await tx.wait();
        setStatus('Address removed from blacklist successfully');
        setAddressToUnblock('');
    } catch (e) {
        setStatus(`Error removing address from blacklist: ${e}`);
    }
};
  const handleGetTask = async () => {
    try {
        if (!window.ethereum || !queryTaskId) {
            throw new Error('Please provide a task ID');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
            ORCHESTRATOR_ADDRESS,
            ORCHESTRATOR_ABI,
            signer
        );

        const task = await contract.getTask(queryTaskId);
        setTaskDetails({
            status: getStatusString(Number(task[0])), // Convert uint8 to string status
            currentRound: Number(task[1]),
            participants: task[2]
        });
        setStatus('Task details retrieved successfully');


    } catch (e) {
        setStatus(`Error getting task: ${e}`);
        setTaskDetails(null);
    }
};

const handleStartTask = async (taskId: string) => {
  try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
          ORCHESTRATOR_ADDRESS,
          ORCHESTRATOR_ABI,
          signer
      );

      setStatus('Starting task...');
      const tx = await contract.startTask(taskId);
      await tx.wait();
      setStatus('Task started successfully');
      
      // Refresh task details
      handleGetTask();
  } catch (e) {
      setStatus(`Error starting task: ${e}`);
  }
};

const handleProgressRound = async (taskId: string) => {
  try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
          ORCHESTRATOR_ADDRESS,
          ORCHESTRATOR_ABI,
          signer
      );

      setStatus('Progressing to next round...');
      const tx = await contract.progressToNextRound(taskId);
      await tx.wait();
      setStatus('Progressed to next round successfully');
      
      // Refresh task details
      handleGetTask();
  } catch (e) {
      setStatus(`Error progressing round: ${e}`);
  }
};

const handleFinishTask = async (taskId: string) => {
  try {
      if (!taskDetails?.participants) {
          throw new Error('No participants found');
      }

      // Convert scores to array in same order as participants
      const scoresArray = taskDetails.participants.map(addr => {
          const score = participantScores[addr] || '0';
          return BigInt(score);
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
          ORCHESTRATOR_ADDRESS,
          ORCHESTRATOR_ABI,
          signer
      );

      setStatus('Finishing task...');
      const tx = await contract.finishTask(taskId, scoresArray);
      await tx.wait();
      setStatus('Task finished successfully');
      
      // Clear scores and refresh
      setParticipantScores({});
      handleGetTask();
  } catch (e) {
      setStatus(`Error finishing task: ${e}`);
  }
};

  const handleProposeTask = async () => {
      try {
          if (!window.ethereum) {
              throw new Error('Please install a wallet');
          }

          const participantArray = participants
              .split(',')
              .map(addr => addr.trim())
              .filter(addr => addr !== '');

          if (participantArray.length === 0) {
              throw new Error('Please enter at least one participant');
          }
          if (!rewardPool || !initialTokens) {
              throw new Error('Please fill all fields');
          }

          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(
              ORCHESTRATOR_ADDRESS,
              ORCHESTRATOR_ABI,
              signer
          );

          const rewardPoolWei = ethers.parseEther(rewardPool);
          const initialTokensBigInt = BigInt(initialTokens);

          setStatus('Proposing task...');
          
          // Call the contract function and get the transaction
          const tx = await contract.proposeTask(
              participantArray,
              rewardPoolWei,
              initialTokensBigInt
          );

          setStatus('Waiting for confirmation...');
          
          // Wait for the transaction to be mined
          const receipt = await tx.wait();
          
          // Get the return value from the transaction
          const returnValue = await contract.proposeTask.staticCall(
              participantArray,
              rewardPoolWei,
              initialTokensBigInt
          );
          
          // Convert BigInt to string for display
          const taskIdValue = returnValue.toString();
          setTaskId(taskIdValue);
          setStatus('Task proposed successfully!');

          // Log for debugging
          console.log('Transaction receipt:', receipt);
          console.log('Returned Task ID:', taskIdValue);

      } catch (e) {
          setStatus(`Error: ${e}`);
          setTaskId(null);
          console.error('Error details:', e);
      }
  };

    

  return (
      <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
              <button 
    onClick={onClickConnect}
    style={{ 
        padding: '10px 20px', 
        background: '#007bff', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer' 
    }}
>
    Connect to MetaMask
</button>
          <h2>Propose New FL Task</h2>
          
          <div style={{ marginBottom: '15px' }}>
              <label>
                  Initial Participants (comma-separated addresses):
                  <br />
                  <input
                      type="text"
                      value={participants}
                      onChange={(e) => setParticipants(e.target.value)}
                      placeholder="0x123..., 0x456..."
                      style={{ width: '100%', padding: '5px' }}
                  />
              </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
              <label>
                  Reward Pool - Total Tokens:
                  <br />
                  <input
                      type="number"
                      value={rewardPool}
                      onChange={(e) => setRewardPool(e.target.value)}
                      placeholder="500"
                      style={{ width: '100%', padding: '5px' }}
                  />
              </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
              <label>
                  Initial Access Tokens:
                  <br />
                  <input
                      type="number"
                      value={initialTokens}
                      onChange={(e) => setInitialTokens(e.target.value)}
                      placeholder="100"
                      style={{ width: '100%', padding: '5px' }}
                  />
              </label>
          </div>

          <button 
              onClick={handleProposeTask}
              style={{ 
                  padding: '10px 20px', 
                  background: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
              }}
          >
              Propose Task
          </button>

          {status && (
              <div style={{ marginTop: '15px', color: status.includes('Error') ? 'red' : 'green' }}>
                  {status}
              </div>
          )}

          {taskId && (
              <div style={{ 
                  marginTop: '15px', 
                  padding: '10px', 
                  background: '#f0f0f0', 
                  borderRadius: '4px' 
              }}>
                  <strong>Task ID:</strong> {taskId}
              </div>
          )}
          <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
    <h3>Get Task Details</h3>
    <div style={{ marginBottom: '15px' }}>
        <label>
            Task ID:
            <br />
            <input
                type="number"
                value={queryTaskId}
                onChange={(e) => setQueryTaskId(e.target.value)}
                placeholder="Enter task ID"
                style={{ width: '100%', padding: '5px' }}
            />
        </label>
    </div>
    <button 
        onClick={handleGetTask}
        style={{ 
            padding: '10px 20px', 
            background: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
        }}
    >
        Get Task Details
    </button>

    {taskDetails && (
        <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            background: '#f0f0f0', 
            borderRadius: '4px' 
        }}>
            <p><strong>Status:</strong> {taskDetails.status}</p>
            <p><strong>Current Round:</strong> {taskDetails.currentRound}</p>
            <p><strong>Participants:</strong></p>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {taskDetails.participants.map((addr, index) => (
                    <li key={index}>{addr}</li>
                ))}
            </ul>
            {taskDetails && taskDetails.status === "ACTIVE" &&taskDetails.participants.length > 0 && (
    <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        background: '#f8f9fa', 
        borderRadius: '4px' 
    }}>
        <h4>Set Participant Scores</h4>
        {taskDetails.participants.map((addr, index) => (
            <div key={addr} style={{ marginBottom: '10px' }}>
                <label>
                    Score for {addr}:
                    <input
                        type="number"
                        value={participantScores[addr] || ''}
                        onChange={(e) => setParticipantScores(prev => ({
                            ...prev,
                            [addr]: e.target.value
                        }))}
                        placeholder="Enter score"
                        style={{ 
                            width: '100px', 
                            marginLeft: '10px',
                            padding: '3px' 
                        }}
                    />
                </label>
            </div>
        ))}
        <button 
            onClick={() => handleFinishTask(queryTaskId)}
            style={{ 
                padding: '5px 10px', 
                background: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                marginTop: '10px'
            }}
        >
            Finish Task with Scores
        </button>
    </div>
)}
            <button 
            onClick={() => handleStartTask(queryTaskId)}
            style={{ 
                padding: '5px 10px', 
                background: '#17a2b8', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                marginRight: '10px'
            }}
        >
            Start Task
        </button>
        <button 
            onClick={() => handleProgressRound(queryTaskId)}
            style={{ 
                padding: '5px 10px', 
                background: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
            }}
        >
            Progress Round
        </button>
        <button 
    onClick={() => handleRegisterForTask(queryTaskId)}
    style={{ 
        padding: '5px 10px', 
        background: '#6c757d', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer',
        marginLeft: '10px'
    }}
>
    Register for Task
</button>
        </div>
        
        
    ) 
    }
</div><div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
    <h3>Address Blacklist Management</h3>
    
    <div style={{ marginBottom: '15px' }}>
        <label>
            Address to Blacklist:
            <br />
            <input
                type="text"
                value={addressToBlacklist}
                onChange={(e) => setAddressToBlacklist(e.target.value)}
                placeholder="0x..."
                style={{ width: '100%', padding: '5px' }}
            />
        </label>
        <button 
            onClick={handleBlacklist}
            style={{ 
                padding: '5px 10px', 
                background: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                marginTop: '5px'
            }}
        >
            Blacklist Address
        </button>
    </div>

    <div style={{ marginBottom: '15px' }}>
        <label>
            Address to Unblock:
            <br />
            <input
                type="text"
                value={addressToUnblock}
                onChange={(e) => setAddressToUnblock(e.target.value)}
                placeholder="0x..."
                style={{ width: '100%', padding: '5px' }}
            />
        </label>
        <button 
            onClick={handleUnblock}
            style={{ 
                padding: '5px 10px', 
                background: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                marginTop: '5px'
            }}
        >
            Remove from Blacklist
        </button>
    </div>
</div>
      </div>
  );
};

export default OrchestratorInterface;