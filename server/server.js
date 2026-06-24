const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/utils/logger');

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`🚀 BookIt API server running on port ${PORT}`);
  logger.info(`📋 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
