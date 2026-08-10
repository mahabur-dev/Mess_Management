const path = require('node:path');

const distRoot = path.resolve(__dirname, '../dist');
process.env.NODE_PATH = distRoot;
require('node:module').Module._initPaths();

require(path.join(distRoot, 'src/main.js'));
