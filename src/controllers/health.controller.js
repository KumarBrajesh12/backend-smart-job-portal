import asyncHandler from '../utils/asyncHandler.js';
import { getDbStatus } from '../config/db.js';

const startTime = Date.now();

export const getHealth = asyncHandler(async (req, res) => {
  const db = getDbStatus();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptime: {
        seconds: uptimeSeconds,
        human: `${uptimeSeconds}s`,
      },
      database: {
        status: db.status,
        connected: db.isConnected,
      },
      timestamp: new Date().toISOString(),
    },
  });
});
