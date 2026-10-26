const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const startJobs = require('./jobs/expirePending');

(async () => {
  await connectDB();
  startJobs();
  const server = app.listen(env.port, () => console.log(`API listening on :${env.port} (${env.nodeEnv})`));

  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
})().catch((e) => {
  console.error('Failed to start server:', e.message);
  process.exit(1);
});

process.on('unhandledRejection', (e) => console.error('Unhandled rejection:', e));
