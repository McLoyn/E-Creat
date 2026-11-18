import 'dotenv/config';
import { app } from './app.js';
import { envConfig } from './utils/env.js';

const PORT = envConfig.port;
const HOST = envConfig.host;

app.listen(PORT, HOST, () => {
  console.log(`[Ekraf HUB API] Server running on http://${HOST}:${PORT}`);
  console.log(`[Ekraf HUB API] Health check at http://${HOST}:${PORT}/api/v1/health`);
  console.log(`[Ekraf HUB API] Environment: ${envConfig.nodeEnv}`);
});
