/**
 * ORBIT QuickContent — Standardized API Error & Response Engine
 */

import { Response } from "express";

export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_FORBIDDEN"
  | "AUTH_INVALID_TOKEN"
  | "AUTH_EXPIRED_TOKEN"
  | "BOOKING_NOT_FOUND"
  | "BOOKING_INVALID_STATE"
  | "BOOKING_INVALID_STATE_TRANSITION"
  | "BOOKING_ALREADY_ASSIGNED"
  | "DISPATCH_TIMEOUT"
  | "NO_PARTNER_AVAILABLE"
  | "NO_PARTNER_ASSIGNED"
  | "PAYMENT_NOT_FOUND"
  | "PAYMENT_ALREADY_PROCESSED"
  | "PAYMENT_VERIFICATION_FAILED"
  | "REFUND_FAILED"
  | "EARNING_NOT_FOUND"
  | "EARNING_ALREADY_RELEASED"
  | "INSUFFICIENT_BALANCE"
  | "INVALID_AMOUNT"
  | "WITHDRAWAL_ALREADY_PROCESSED"
  | "EDITOR_NOT_AVAILABLE"
  | "UPLOAD_INVALID"
  | "INVALID_URL"
  | "RESOURCE_FORBIDDEN"
  | "VALIDATION_FAILED"
  | "INTERNAL_SERVER_ERROR";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: ApiErrorCode | string;
    message: string;
    requestId?: string;
    details?: any;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
}

export function sendError(
  res: Response,
  code: ApiErrorCode | string,
  message: string,
  statusCode: number = 400,
  requestId?: string,
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      requestId,
      ...(details ? { details } : {}),
    },
  });
}
