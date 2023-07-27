const shell = require('shelljs');
const { buildElectron } = require('./dev-electron');

(async () => {
  await buildElectron({ compile: true, bootstrap: false });
  shell.env.NODE_ENV = 'test';
  shell.exec('mocha -r test/server/hook.ts --file test/server/*.test.ts -n loader=ts-node/esm');
})();
