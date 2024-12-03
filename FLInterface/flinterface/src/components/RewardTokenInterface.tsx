import React, {useEffect, useState } from 'react';
import { ethers, Contract } from 'ethers';
import {REWARDTOKEN_ABI} from './abis/RewardTokenAbi'
import deployedAddresses from './Addresses.json';

declare let window: any;

const REWARDTOKEN_ADDRESS = deployedAddresses['Tokens#FLRToken'];
const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

const RewardTokenInterface = () => {
    const [minterRole, setMinterRole] = useState('');
    const [status, setStatus] = useState('');
    const [mintStatus, setMintStatus] = useState('');
    const [mintAmount, setMintAmount] = useState('');
    const [mintAddress, setMintAddress] = useState('');
    const [currentAccount, setCurrentAccount] = useState('');
    const [balance, setBalance] =useState<number|undefined>(undefined)

    const handleMint = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                REWARDTOKEN_ADDRESS,
                REWARDTOKEN_ABI,
                signer
            );
            
            const tx = await contract.mint(mintAddress, mintAmount);
            await tx.wait();
            setMintStatus('minted!');

        } catch (err) {
            setMintStatus(`Error minting: ${err}`); 
        }         
    }  

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
    const queryTokenBalance = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const account = accounts[0];
        
        const erc20 = new ethers.Contract(REWARDTOKEN_ADDRESS, REWARDTOKEN_ABI, provider);
        
        erc20.balanceOf(account)
        .then((result:string)=>{
            setBalance(Number(ethers.formatEther(result)))
        }).catch((e:Error)=>console.log(e))
        
        //const rawResult = await provider.call({
        //    to: REWARDTOKEN_ADDRESS,
        //    data: erc20.interface.encodeFunctionData('balanceOf', [account])
        //});
        //console.log('Raw result:', rawResult);

        
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

<div style={{ marginBottom: '20px' }}>
    <h3>Get Token Amount</h3>
    <button
        onClick={queryTokenBalance}
        style={{ 
            padding: '10px 20px',
            background: '#6c757d',
            color: 'green',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        }}
    >
        Get Balance
    </button>

    {balance !== null && (
        <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            background: '#f0f0f0', 
            borderRadius: '4px' 
        }}>
            <strong>Token Balance:</strong> {balance}
        </div>
    )}
</div>

    <div style={{ marginBottom: '15px' }}>
        <label>
            Address to mint to
            <br />
            <input
                type="text"
                value={mintAddress}
                onChange={(e) => setMintAddress(e.target.value)}
                style={{ width: '100%', padding: '5px' }}
            />
        </label>
    </div>
    <div style={{ marginBottom: '15px' }}>
        <label>
            Amount to Mint
            <br />
            <input
                type="text"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                style={{ width: '100%', padding: '5px' }}
            />
        </label>
    </div>
    <button
        onClick={handleMint}
        style={{ 
            padding: '10px 20px',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        }}
    >
        Mint
    </button>
    {status && (
              <div style={{ 
                  marginTop: '15px', 
                  padding: '10px', 
                  background: '#f0f0f0', 
                  borderRadius: '4px',
                  color: mintStatus.includes('Error') ? 'red' : 'green'
              }}>
                  {mintStatus}
          </div>
    )}
    </div>
)

};
export default RewardTokenInterface;