const prompt = require('prompt-sync')();
const { generateProof, saveToFile } = require('./proofUtils');
const { processVote, getVotingResults, registerVoters } = require('./votingSystem');

/**
 * CLI command to download a voting ticket
 */
async function downloadTicket() {
    try {
        const addr = prompt('Enter your account address: ');
        const { proof, publicSignals } = await generateProof(addr);
        
        const ticket = {
            proof: proof,
            publicSignals: publicSignals
        };
        
        await saveToFile(ticket, "ticket");
    } catch (error) {
        console.error("Error downloading ticket:", error);
        process.exit(1);
    }
}

/**
 * CLI command to cast a vote and then display the results.
 */
async function castVote() {
    try {
        const voteOption = prompt('Enter your vote (a for Yes, b for No): ');
        const success = await processVote(voteOption);
        
        if (success) {
            console.log("\nFetching updated voting results...");
            const results = await getVotingResults(); // Now an async call
            if (results) {
                console.log("\nCurrent Voting Results:");
                console.log(`Yes (a): ${results.yesVotes} votes`);
                console.log(`No (b): ${results.noVotes} votes`);
                console.log(`Total votes: ${results.totalVotes}`);
            }
        }
    } catch (error) {
        console.error("Error casting vote:", error);
        process.exit(1);
    }
}

/**
 * CLI command to start a new poll by registering voters.
 */
async function startPoll() {
    console.log("Initializing new poll...");
    await registerVoters();
    console.log("Poll initialized successfully!");
}

module.exports = {
    downloadTicket,
    castVote,
    startPoll
};