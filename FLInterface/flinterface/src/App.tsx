import React from 'react';

import OrchestratorInterface from './components/OrchestratorInterface2';
import RewarderInterface from './components/RewarderInterface';
import MATInterface from './components/MATInterface';
import RewardTokenInterface from './components/RewardTokenInterface';



function App() {
 
  return (
    <div className="App">
      <OrchestratorInterface />
      <RewarderInterface />
      <MATInterface />
      <RewardTokenInterface />
    </div>
  );
}

export default App;