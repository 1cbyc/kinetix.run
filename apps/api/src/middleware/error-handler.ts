import type { Context, ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { ERROR_CODES, HTTP_STATUS } from "@kinetix/shared";

export const errorHandler: ErrorHandler = (err, c: Context) => {
  console.error("Error:", err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Validation failed",
          details: err.flatten(),
        },
      },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // HTTP exceptions from Hono
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: err.message || ERROR_CODES.INTERNAL_ERROR,
          message: err.message,
        },
      },
      err.status
    );
  }

  // Application errors with code
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      err.status as 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500
    );
  }

  // Unknown errors
  return c.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : err.message || "Unknown error",
      },
    },
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
};

// Custom application error class
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = HTTP_STATUS.BAD_REQUEST,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Helper functions to throw common errors
export function notFound(resource = "Resource"): never {
  throw new AppError(
    ERROR_CODES.NOT_FOUND,
    `${resource} not found`,
    HTTP_STATUS.NOT_FOUND
  );
}

export function unauthorized(message = "Unauthorized"): never {
  throw new AppError(
    ERROR_CODES.UNAUTHORIZED,
    message,
    HTTP_STATUS.UNAUTHORIZED
  );
}

export function forbidden(message = "Forbidden"): never {
  throw new AppError(ERROR_CODES.UNAUTHORIZED, message, HTTP_STATUS.FORBIDDEN);
}

export function conflict(message: string): never {
  throw new AppError(ERROR_CODES.CONFLICT, message, HTTP_STATUS.CONFLICT);
}

export function badRequest(message: string): never {
  throw new AppError(
    ERROR_CODES.INVALID_INPUT,
    message,
    HTTP_STATUS.BAD_REQUEST
  );
}
