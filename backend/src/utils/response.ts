import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): void => {
  res.status(statusCode).json({ success: true, message, data } as ApiResponse<T>);
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created'): void => {
  sendSuccess(res, data, message, 201);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Record<string, string[]>
): void => {
  res.status(statusCode).json({ success: false, error: message, errors } as ApiResponse);
};

export const sendUnauthorized = (res: Response, message = 'Unauthorized'): void => {
  sendError(res, message, 401);
};

export const sendForbidden = (res: Response, message = 'Forbidden'): void => {
  sendError(res, message, 403);
};

export const sendNotFound = (res: Response, message = 'Not found'): void => {
  sendError(res, message, 404);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
): void => {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  } as ApiResponse<T[]>);
};
