const path = require('node:path');

const distRoot = path.resolve(__dirname, '../dist');
process.env.NODE_PATH = distRoot;
require('node:module').Module._initPaths();

// `nest build` (SWC) compiles `src/**/*` into `dist/` mirroring the `src`
// layout, so the entry point is `dist/main.js` — NOT `dist/src/main.js`.
// (A stale `dist/src/main.js` from an old `tsc` build made the old path
// appear to work locally, but it never exists in a clean Docker build.)
require(path.join(distRoot, 'main.js'));
