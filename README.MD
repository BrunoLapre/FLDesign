This is a collection of smart contracts and associated components to help organise an off-chain FL system. Utilizes Tasks as registering the participants and the active task, and uses both ERC20 and ERC1155 tokens as reward tokens and model access tokenization respectively as rewards for contributions.

Please note the contracts are implemented as proof of concepts and are not currently suitable for deployment. Additionally, I definitely broke something pre-version control so the initial commit doesn't work fully as intended.


How to Use:

To just run a single hardhat node, the simplest way to prove functionality:

Make sure the environment has everything you need by running npm hardhat, else make sure you get everything with npm install

Run the node using npx hardhat node

Deploy the contracts using npx hardhat ignition deploy igntion/modules/main.js --network localhost

The deployment chain ID can be adjusted in the hardhat.config.js to 1337 (default) or some other value if ran on a Hyperledger network

Copy the deployed address information to the frontend using
cp ./ignition/deployments/chain-1337/deployed_addresses.json ./FLInterface/src/components/Addresses.json
Making sure you're in the FLDesign directory

Login to test account 0 on MetaMask with the private keys as provided by the node output, that's the admin account on every contract

in FLInterface, npx start after making sure you got everything with npm install