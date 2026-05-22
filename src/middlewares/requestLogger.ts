import morgan from 'morgan';
import env from '../config/env.js';

const devFormat =
  ':method :url :status :res[content-length] - :response-time ms';
const prodFormat = ':remote-addr - :method :url :status :response-time ms';

const requestLogger = morgan(env.isDevelopment ? devFormat : prodFormat, {
  skip: (req) => req.url === '/health',
});

export default requestLogger;
