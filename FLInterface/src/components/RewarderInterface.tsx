import React, { useState } from 'react';
import { ethers, Contract } from 'ethers';
import {REWARDER_ABI} from './abis/RewarderAbi';
import deployedAddresses from './Addresses.json';

declare let window: any;

const REWARDER_ADDRESS = deployedAddresses['Rewarder#FLRewarder'];

const RewarderInterface = () => {
  const [taskId, setTaskId] = useState('');
  const [round, setRound] = useState('');
  const [participants, setParticipants] = useState('');
  const [scores, setScores] = useState('');
  const [flrTokenPool, setFlrTokenPool] = useState('');
  const [modelTokenAmount, setModelTokenAmount] = useState('');
  const [status, setStatus] = useState('');
  const [scoreCheckTaskId, setScoreCheckTaskId] = useState('');
const [participantToCheck, setParticipantToCheck] = useState('');
const [finalScore, setFinalScore] = useState<string | null>(null);

const handleGetFinalScore = async () => {
  try {
      if (!scoreCheckTaskId || !participantToCheck) {
          throw new Error('Please provide both task ID and participant address');
      }
      if (!ethers.isAddress(participantToCheck)) {
          throw new Error('Invalid participant address');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
          REWARDER_ADDRESS,
          REWARDER_ABI,
          signer
      );

      const score = await contract.getFinalScore(scoreCheckTaskId, participantToCheck);
      setFinalScore(score.toString());
      setStatus('Score retrieved successfully');

  } catch (err) {
      setStatus(`Error getting score: ${err}`);
      setFinalScore(null);
  }
};

  const handleRecordScores = async () => {
      try {
          // Convert comma-separated strings to arrays
          const participantArray = participants
              .split(',')
              .map(addr => addr.trim())
              .filter(addr => addr !== '');
          
          const scoresArray = scores
              .split(',')
              .map(score => score.trim())
              .filter(score => score !== '')
              .map(score => BigInt(score));

          if (participantArray.length !== scoresArray.length) {
              throw new Error('Number of participants and scores must match');
          }

          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(
              REWARDER_ADDRESS,
              REWARDER_ABI,
              signer
          );

          setStatus('Recording round scores...');
          const tx = await contract.recordRoundScores(taskId, round, participantArray, scoresArray);
          await tx.wait();
          setStatus('Round scores recorded successfully');

      } catch (err) {
          setStatus(`Error recording scores: ${err}`);
      }
  };

  const handleCalculateRewards = async () => {
      try {
          const participantArray = participants
              .split(',')
              .map(addr => addr.trim())
              .filter(addr => addr !== '');
          
          const scoresArray = scores
              .split(',')
              .map(score => score.trim())
              .filter(score => score !== '')
              .map(score => BigInt(score));

          if (participantArray.length !== scoresArray.length) {
              throw new Error('Number of participants and scores must match');
          }

          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(
              REWARDER_ADDRESS,
              REWARDER_ABI,
              signer
          );

          setStatus('Calculating rewards...');
          const tx = await contract.calculateRewards(
              taskId,
              participantArray,
              scoresArray,
              BigInt(flrTokenPool),
              BigInt(modelTokenAmount)
          );
          await tx.wait();
          setStatus('Rewards calculated successfully');

      } catch (err) {
          setStatus(`Error calculating rewards: ${err}`);
      }
  };

  const handleClaimRewards = async () => {
    try {
        if (!taskId) {
            throw new Error('Please enter a task ID');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
            REWARDER_ADDRESS,
            REWARDER_ABI,
            signer
        );

        setStatus('Claiming rewards...');
        const tx = await contract.claimRewards(taskId);
        await tx.wait();            
        
        setStatus('Rewards claimed successfully');

    } catch (err) {
        setStatus(`Error claiming rewards: ${err}`);
    }
};

  return (
      <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
          <h2>FLRewarder Interface</h2>

          <div style={{ marginBottom: '30px' }}>
              <h3>Record Round Scores</h3>
              <div style={{ marginBottom: '15px' }}>
                  <label>
                      Task ID:
                      <br />
                      <input
                          type="number"
                          value={taskId}
                          onChange={(e) => setTaskId(e.target.value)}
                          style={{ width: '100%', padding: '5px' }}
                      />
                  </label>
              </div>
              <div style={{ marginBottom: '15px' }}>
                  <label>
                      Round:
                      <br />
                      <input
                          type="number"
                          value={round}
                          onChange={(e) => setRound(e.target.value)}
                          style={{ width: '100%', padding: '5px' }}
                      />
                  </label>
              </div>
              <div style={{ marginBottom: '15px' }}>
                  <label>
                      Participants (comma-separated addresses):
                      <br />
                      <input
                          type="text"
                          value={participants}
                          onChange={(e) => setParticipants(e.target.value)}
                          style={{ width: '100%', padding: '5px' }}
                      />
                  </label>
              </div>
              <div style={{ marginBottom: '15px' }}>
                  <label>
                      Scores (comma-separated numbers):
                      <br />
                      <input
                          type="text"
                          value={scores}
                          onChange={(e) => setScores(e.target.value)}
                          style={{ width: '100%', padding: '5px' }}
                      />
                  </label>
              </div>
              <button
                  onClick={handleRecordScores}
                  style={{ 
                      padding: '10px 20px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                  }}
              >
                  Record Scores
              </button>
          </div>

          <div style={{ marginBottom: '30px' }}>
              <h3>Calculate Rewards</h3>
              <div style={{ marginBottom: '15px' }}>
                  <label>
                      FLR Token Pool:
                      <br />
                      <input
                          type="number"
                          value={flrTokenPool}
                          onChange={(e) => setFlrTokenPool(e.target.value)}
                          style={{ width: '100%', padding: '5px' }}
                      />
                  </label>
              </div>
              <div style={{ marginBottom: '15px' }}>
                  <label>
                      Model Token Amount:
                      <br />
                      <input
                          type="number"
                          value={modelTokenAmount}
                          onChange={(e) => setModelTokenAmount(e.target.value)}
                          style={{ width: '100%', padding: '5px' }}
                      />
                  </label>
              </div>
              <button
                  onClick={handleCalculateRewards}
                  style={{ 
                      padding: '10px 20px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                  }}
              >
                  Calculate Rewards
              </button>
          </div>

          <div style={{ marginBottom: '30px' }}>
    <h3>Claim Rewards</h3>
    <div style={{ marginBottom: '15px' }}>
        <label>
            Task ID:
            <br />
            <input
                type="number"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                style={{ width: '100%', padding: '5px' }}
            />
        </label>
    </div>
    <button
        onClick={handleClaimRewards}
        style={{ 
            padding: '10px 20px',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        }}
    >
        Claim Rewards
    </button>
</div>

<div style={{ marginBottom: '30px' }}>
    <h3>Check Final Score</h3>
    <div style={{ marginBottom: '15px' }}>
        <label>
            Task ID:
            <br />
            <input
                type="number"
                value={scoreCheckTaskId}
                onChange={(e) => setScoreCheckTaskId(e.target.value)}
                style={{ width: '100%', padding: '5px' }}
            />
        </label>
    </div>
    <div style={{ marginBottom: '15px' }}>
        <label>
            Participant Address:
            <br />
            <input
                type="text"
                value={participantToCheck}
                onChange={(e) => setParticipantToCheck(e.target.value)}
                placeholder="0x..."
                style={{ width: '100%', padding: '5px' }}
            />
        </label>
    </div>
    <button
        onClick={handleGetFinalScore}
        style={{ 
            padding: '10px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        }}
    >
        Get Final Score
    </button>

    {finalScore !== null && (
        <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            background: '#f0f0f0', 
            borderRadius: '4px' 
        }}>
            <strong>Final Score:</strong> {finalScore}
        </div>
    )}
</div>

          {status && (
              <div style={{ 
                  marginTop: '15px', 
                  padding: '10px', 
                  background: '#f0f0f0', 
                  borderRadius: '4px',
                  color: status.includes('Error') ? 'red' : 'green'
              }}>
                  {status}
              </div>
          )}
      </div>
  );
};

export default RewarderInterface;