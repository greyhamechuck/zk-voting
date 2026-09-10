require('dotenv').config();
const { ethers } = require('ethers');
const appRoot = require('app-root-path');
const fs = require('fs');
const { saveToFile } = require('./proofUtils');

// Load deployed contract info
const deployedContracts = require(`${appRoot}/deployed-contracts.json`);
const daoVotingArtifact = require(`${appRoot}/build/DAOVoting.json`);

// Keep the original voter registration logic as it's needed for proof generation
const { voters } = require(`${appRoot}/votersList.json`);
async function registerVoters() {
    let voterData = {};
    for(let i = 0; i < voters.length; i++) {
        voterData[voters[i]] = i;
    }
    await saveToFile(voterData, "voter");
    console.log("Voter registration data created.");
}

/**
 * Submits a vote to the DAOVoting smart contract.
 * @param {String} voteOption The voting option ('a' for Yes, 'b' for No)
 * @returns {Boolean} True if the vote was successfully submitted
 */
async function processVote(voteOption) {
    try {
        const ticketPath = `${appRoot}/ticket.json`;
        if (!fs.existsSync(ticketPath)) {
            console.log("Error: Ticket not found. Please generate your ticket first.");
            return false;
        }

        const { proof, publicSignals } = require(ticketPath);

        // Validate vote option and map to uint256 (1 for Yes/a, 0 for No/b)
        let voteValue;
        if (voteOption.toLowerCase() === 'a') {
            voteValue = 1;
        } else if (voteOption.toLowerCase() === 'b') {
            voteValue = 0;
        } else {
            console.log("Error: Invalid vote option. Please choose 'a' or 'b'.");
            return false;
        }

        const provider = new ethers.JsonRpcProvider(process.env.NODE_PROVIDER_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const daoVotingContract = new ethers.Contract(
            deployedContracts.daoVotingAddress,
            daoVotingArtifact.abi,
            wallet
        );

        console.log("Submitting your vote to the smart contract...");

        // The public signals from the proof are [merkleRoot, nullifier, ...otherOutputs]
        // The contract expects [merkleRoot, nullifier, voteValue]
        const inputs = [
            publicSignals[0], // merkleRoot
            publicSignals[1], // nullifier
            voteValue         // vote
        ];

        const tx = await daoVotingContract.submitVote(
            proof.pi_a.slice(0, 2), // a
            [proof.pi_b[0].slice(0, 2), proof.pi_b[1].slice(0, 2)], // b
            proof.pi_c.slice(0, 2), // c
            inputs
        );

        await tx.wait(); // Wait for the transaction to be mined

        console.log("Vote submitted successfully!");
        console.log(`Transaction hash: ${tx.hash}`);
        
        // Clean up the used ticket
        fs.unlinkSync(ticketPath);
        console.log("Used ticket has been deleted.");

        return true;

    } catch (error) {
        console.error("Error processing vote:", error.reason || error.message);
        return false;
    }
}

/**
 * Gets the current voting results from the smart contract.
 * @returns {Object} The voting results { yesVotes, noVotes }
 */
async function getVotingResults() {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.NODE_PROVIDER_URL);
        const daoVotingContract = new ethers.Contract(
            deployedContracts.daoVotingAddress,
            daoVotingArtifact.abi,
            provider
        );

        console.log("Fetching voting results from the smart contract...");
        const [yesVotes, noVotes] = await daoVotingContract.getResults();

        return {
            yesVotes: Number(yesVotes),
            noVotes: Number(noVotes),
            totalVotes: Number(yesVotes) + Number(noVotes)
        };
    } catch (error) {
        console.error("Error getting voting results:", error.reason || error.message);
        return null;
    }
}

module.exports = {
    registerVoters,
    processVote,
    getVotingResults
};