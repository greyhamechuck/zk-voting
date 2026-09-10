const fs = require('fs');
const path = require('path');
const solc = require('solc');

const buildPath = path.resolve(__dirname, '..', 'build');
if (!fs.existsSync(buildPath)) {
  fs.mkdirSync(buildPath);
}

const contractPath = path.resolve(__dirname, '..', 'contracts');

const input = {
  language: 'Solidity',
  sources: {
    'DAOVoting.sol': {
      content: fs.readFileSync(path.resolve(contractPath, 'DAOVoting.sol'), 'utf8')
    },
    'Verifier.sol': {
        content: fs.readFileSync(path.resolve(contractPath, 'Verifier.sol'), 'utf8')
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  output.errors.forEach(err => {
    console.error(err.formattedMessage);
  });
  process.exit(1);
}

for (let contractName in output.contracts['DAOVoting.sol']) {
  fs.writeFileSync(
    path.resolve(buildPath, `${contractName}.json`),
    JSON.stringify(output.contracts['DAOVoting.sol'][contractName], null, 2)
  );
}

for (let contractName in output.contracts['Verifier.sol']) {
    fs.writeFileSync(
      path.resolve(buildPath, `${contractName}.json`),
      JSON.stringify(output.contracts['Verifier.sol'][contractName], null, 2)
    );
}

console.log('Contracts compiled successfully!');