import type { MiddlewareHandler } from "hono";
import { RATE_LIMITS } from "@kinetix/shared";

// Simple in-memory rate limiter
// In production, use Redis for distributed rate limiting
const requests = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(
  config = RATE_LIMITS.api
): MiddlewareHandler {
  return async (c, next) => {
    const ip = c.req.header("x-forwarded-for") || "unknown";
    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    let record = requests.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + config.windowMs };
      requests.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    c.header("X-RateLimit-Limit", config.maxRequests.toString());
    c.header(
      "X-RateLimit-Remaining",
      Math.max(0, config.maxRequests - record.count).toString()
    );
    c.header(
      "X-RateLimit-Reset",
      Math.ceil(record.resetAt / 1000).toString()
    );

    if (record.count > config.maxRequests) {
      return c.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests, please try again later",
          },
        },
        429
      );
    }

    await next();
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requests.entries()) {
    if (now > record.resetAt) {
      requests.delete(key);
    }
  }
}, 60_000);
