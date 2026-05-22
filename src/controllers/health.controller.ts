import type { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { getDbStatus } from '../config/db.js';
import type { ApiSuccessResponse, HealthData } from '../types/index.js';

const startTime = Date.now();

export const getHealth = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const db = getDbStatus();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    const data: HealthData = {
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
    };

    const response: ApiSuccessResponse<HealthData> = {
      success: true,
      data,
    };

    res.status(200).json(response);
  },
);
