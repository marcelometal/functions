const cluster = require('cluster');
const log = require('./support/log');
const routes = require('./http/routes');
const config = require('./support/config');
const globalImport = require('./support/globalImport');
const setupHTTPClient = require('./support/setupHTTPClient');

if (cluster.isMaster && config.useNodeCluster) {
  // Fork workers.
  for (let i = 0; i < config.numCPUs; i += 1) {
    cluster.fork();
  }

  cluster.on('disconnect', (worker) => {
    log.warn(`worker ${worker.process.pid} disconnected`);
    worker.hasForked = true;
    cluster.fork();
  });

  cluster.on('exit', (worker) => {
    log.warn(`worker ${worker.process.pid} died`);
    if (!worker.exitedAfterDisconnect && !worker.hasForked) {
      cluster.fork();
    }
  });
} else {
  globalImport(); // Makes sure to load some support libraries to run the functions
  setupHTTPClient();
  routes.listen(config.port, () => {
    log.info(`Functions beating on port ${config.port}`);
  });
}
