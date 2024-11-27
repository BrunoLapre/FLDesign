import React, {useEffect, useState } from 'react';
import { ethers, Contract } from 'ethers';
import {REWARDTOKEN_ABI} from './abis/RewardTokenAbi'

declare let window: any;

const REWARDTOKEN_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

const RewardTokenInterface = () => {
    const [minterRole, setMinterRole] = useState('');
    const [status, setStatus] = useState('');

    const handlegrantRole = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                REWARDTOKEN_ADDRESS,
                REWARDTOKEN_ABI,
                signer
            );

            const tx = await contract.grantRole(MINTER_ROLE, minterRole);
        } catch (err) {
            setStatus(`Error adjusting Role: ${err}`); 
        }
    } 

return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
          <h2>Token Interface</h2>
          <div style={{ marginBottom: '15px' }}>
        <label>
            address to grant minter:
            <br />
            <input
                type="text"
                value={minterRole}
                onChange={(e) => setMinterRole(e.target.value)}
                style={{ width: '100%', padding: '5px' }}
            />
        </label>
    </div>
    <button
        onClick={handlegrantRole}
        style={{ 
            padding: '10px 20px',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        }}
    >
        Set minter
    </button>
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
)

};
export default RewardTokenInterface;