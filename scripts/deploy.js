require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const verifierArtifact = require('../build/Groth16Verifier.json');
const daoVotingArtifact = require('../build/DAOVoting.json');

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.NODE_PROVIDER_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log('Deploying contracts with the account:', wallet.address);

  const VerifierFactory = new ethers.ContractFactory(verifierArtifact.abi, verifierArtifact.evm.bytecode.object, wallet);
  console.log('Deploying Verifier...');
  const verifier = await VerifierFactory.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log('Verifier deployed to:', verifierAddress);

  const DAOVotingFactory = new ethers.ContractFactory(daoVotingArtifact.abi, daoVotingArtifact.evm.bytecode.object, wallet);
  console.log('Deploying DAOVoting...');
  const daoVoting = await DAOVotingFactory.deploy(verifierAddress);
  await daoVoting.waitForDeployment();
  const daoVotingAddress = await daoVoting.getAddress();
  console.log('DAOVoting deployed to:', daoVotingAddress);

  const deploymentInfo = {
    verifierAddress: verifierAddress,
    daoVotingAddress: daoVotingAddress,
    network: await provider.getNetwork().then(net => net.name),
    deployerAddress: wallet.address
  };

  fs.writeFileSync(
    path.resolve(__dirname, '..', 'deployed-contracts.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('Deployment information saved to deployed-contracts.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });