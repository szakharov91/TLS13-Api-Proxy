const fs = require('fs');
const path = require('path');
const createApp = require('./app');

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '-p') result.port = parseInt(argv[++i], 10);
    else if (argv[i] === '-k') result.keyFile = argv[++i];
  }
  return result;
}

function loadKeys(filePath) {
  const content = fs.readFileSync(path.resolve(filePath), 'utf8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

const { port, keyFile } = parseArgs(process.argv.slice(2));

if (!port) {
  console.error('Error: -p <port> is required');
  process.exit(1);
}
if (!keyFile) {
  console.error('Error: -k <keys-file> is required');
  process.exit(1);
}

let clientKeys;
try {
  clientKeys = loadKeys(keyFile);
} catch (err) {
  console.error('Error reading keys file:', err.message);
  process.exit(1);
}

if (clientKeys.length === 0) {
  console.error('Error: keys file is empty');
  process.exit(1);
}

const app = createApp(clientKeys);
app.listen(port, () => {
  console.log('Proxy running on http://localhost:' + port);
});
