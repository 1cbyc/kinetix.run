import type { MiddlewareHandler } from "hono";
import { verifyAccessToken } from "../services/auth";
import { unauthorized } from "./error-handler";
import type { AppEnv } from "../types";

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    unauthorized("Missing or invalid authorization header");
  }

  const token = authHeader.slice(7);
  const payload = await verifyAccessToken(token);

  if (!payload) {
    unauthorized("Invalid or expired token");
  }

  c.set("userId", payload.sub);

  await next();
};
