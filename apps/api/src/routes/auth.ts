import { Hono } from "hono";
import { RegisterSchema, LoginSchema } from "@kinetix/shared";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logout,
  logoutAll,
  getUserById,
} from "../services/auth";
import { requireAuth } from "../middleware/auth";
import { rateLimiter } from "../middleware/rate-limiter";
import { RATE_LIMITS } from "@kinetix/shared";
import type { AppEnv } from "../types";

export const authRoutes = new Hono<AppEnv>();

// Apply stricter rate limiting to auth routes
authRoutes.use("*", rateLimiter(RATE_LIMITS.auth));

// Register
authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const input = RegisterSchema.parse(body);

  const result = await registerUser(input);

  return c.json(
    {
      success: true,
      data: result,
    },
    201
  );
});

// Login
authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const input = LoginSchema.parse(body);

  const result = await loginUser(input);

  return c.json({
    success: true,
    data: result,
  });
});

// Refresh token
authRoutes.post("/refresh", async (c) => {
  const body = await c.req.json();
  const { refreshToken } = body;

  if (!refreshToken) {
    return c.json(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Refresh token is required",
        },
      },
      400
    );
  }

  const tokens = await refreshAccessToken(refreshToken);

  return c.json({
    success: true,
    data: tokens,
  });
});

// Logout (invalidate refresh token)
authRoutes.post("/logout", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const body = await c.req.json();
  const { refreshToken } = body;

  if (refreshToken) {
    await logout(userId, refreshToken);
  }

  return c.json({
    success: true,
    data: { message: "Logged out successfully" },
  });
});

// Logout from all devices
authRoutes.post("/logout-all", requireAuth, async (c) => {
  const userId = c.get("userId")!;

  await logoutAll(userId);

  return c.json({
    success: true,
    data: { message: "Logged out from all devices" },
  });
});

// Get current user
authRoutes.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId")!;

  const user = await getUserById(userId);

  if (!user) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      },
      404
    );
  }

  return c.json({
    success: true,
    data: user,
  });
});
