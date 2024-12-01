This is a collection of smart contracts and associated components to help organise an off-chain FL system. Utilizes Tasks as registering the participants and the active task, and uses both ERC20 and ERC1155 tokens as reward tokens and model access tokenization respectively as rewards for contributions.

Please note the contracts are implemented as proof of concepts and are not currently suitable for deployment. Additionally, I definitely broke something pre-version control so the initial commit doesn't work fully as intended.


How to Use:

To just run a single hardhat node, the simplest way to prove functionality:

Make sure the environment has everything you need by running npm hardhat

Run the node using npx hardhat node

Deploy the contracts using npx hardhat ignition deploy igntion/modules/main.js --network localhost

Copy the deployed address information to the frontend using
cp FLDesign/ignition/deployments/chain-1337/deployed_addresses.json FLDesign/FLInterface/src/components/Addresses.json

Login to test account 0 on MetaMask as provided by the node output

in FLInterface, npx start