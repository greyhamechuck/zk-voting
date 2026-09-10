const { startPoll } = require('./cli');
const { Wallet } = require('ethers');
const fs = require('fs');
const path = require('path');

async function generateVoters() {
    const voters = [];
    console.log("Generating 10 random voter addresses...");
    for (let i = 0; i < 10; i++) {
        const wallet = Wallet.createRandom();
        voters.push(wallet.address);
    }

    const votersList = {
        voters: voters
    };

    const filePath = path.resolve(__dirname, '..', 'votersList.json');
    fs.writeFileSync(filePath, JSON.stringify(votersList, null, 2));
    console.log(`Voter list saved to ${filePath}`);
}

async function main() {
    await generateVoters();
    // Now that the list is generated, run the original poll initialization
    await startPoll();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });