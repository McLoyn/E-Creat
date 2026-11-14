import 'dotenv/config';
import { app } from './app.js';
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = '127.0.0.1';
app.listen(PORT, HOST, () => {
    console.log(`[Ekraf HUB API] Server running on http://${HOST}:${PORT}`);
    console.log(`[Ekraf HUB API] Health check at http://${HOST}:${PORT}/api/v1/health`);
});
