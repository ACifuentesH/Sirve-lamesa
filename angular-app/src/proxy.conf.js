/**
 * Reenvía /api al backend Express. El puerto debe ser el mismo que PORT en el .env de la raíz del repo.
 */
const path = require('path');
const fs = require('fs');

(function loadPortFromRootEnv() {
  try {
    const envFile = path.join(__dirname, '..', '..', '.env');
    const text = fs.readFileSync(envFile, 'utf8');
    const line = text.split(/\r?\n/).find((l) => /^\s*PORT\s*=/.test(l));
    if (line) {
      const raw = line.replace(/^\s*PORT\s*=\s*/, '').trim();
      process.env.PORT = raw.replace(/^["']|["']$/g, '');
    }
  } catch (_) {
    /* sin .env o sin PORT: se usa el default */
  }
})();

const port = process.env.PORT || '3000';

module.exports = {
  '/api': {
    target: `http://127.0.0.1:${port}`,
    secure: false,
    changeOrigin: true,
    logLevel: 'warn',
    timeout: 120000,
    proxyTimeout: 120000,
  },
};
