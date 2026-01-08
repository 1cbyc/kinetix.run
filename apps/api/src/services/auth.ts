import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import { db, users, refreshTokens } from "@kinetix/db";
import { eq } from "drizzle-orm";
import {
  generateId,
  JWT_CONFIG,
  type JWTPayload,
  type RegisterInput,
  type LoginInput,
} from "@kinetix/shared";
import { AppError, conflict, unauthorized } from "../middleware/error-handler";
import { ERROR_CODES, HTTP_STATUS } from "@kinetix/shared";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-change-in-production"
);

const SALT_ROUNDS = 12;

export async function registerUser(input: RegisterInput) {
  // Check if email already exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  });

  if (existing) {
    conflict("Email already registered");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Create user
  const userId = generateId("usr");
  const [user] = await db
    .insert(users)
    .values({
      id: userId,
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name || null,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
    });

  // Generate tokens
  const tokens = await generateTokens(user.id, user.email);

  return {
    user,
    ...tokens,
  };
}

export async function loginUser(input: LoginInput) {
  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  });

  if (!user) {
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      "Invalid email or password",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Verify password
  const valid = await bcrypt.compare(input.password, user.passwordHash);

  if (!valid) {
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      "Invalid email or password",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Generate tokens
  const tokens = await generateTokens(user.id, user.email);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    ...tokens,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  // Verify refresh token
  const payload = await verifyRefreshToken(refreshToken);

  if (!payload) {
    unauthorized("Invalid refresh token");
  }

  // Check if token exists in database
  const tokenHash = await hashToken(refreshToken);
  const storedToken = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenHash, tokenHash),
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    unauthorized("Invalid or expired refresh token");
  }

  // Get user
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.sub),
  });

  if (!user) {
    unauthorized("User not found");
  }

  // Delete old refresh token
  await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));

  // Generate new tokens
  const tokens = await generateTokens(user.id, user.email);

  return tokens;
}

export async function logout(userId: string, refreshToken: string) {
  const tokenHash = await hashToken(refreshToken);

  // Delete the specific refresh token
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function logoutAll(userId: string) {
  // Delete all refresh tokens for user
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}

async function generateTokens(userId: string, email: string) {
  // Generate access token (short-lived)
  const accessToken = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(JWT_CONFIG.issuer)
    .setExpirationTime(JWT_CONFIG.accessTokenExpiry)
    .sign(JWT_SECRET);

  // Generate refresh token (long-lived)
  const refreshToken = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(JWT_CONFIG.issuer)
    .setExpirationTime(JWT_CONFIG.refreshTokenExpiry)
    .sign(JWT_SECRET);

  // Store refresh token hash in database
  const tokenHash = await hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(refreshTokens).values({
    id: generateId("rtk"),
    userId,
    tokenHash,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export async function verifyAccessToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_CONFIG.issuer,
    });

    return payload as JWTPayload;
  } catch {
    return null;
  }
}

async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_CONFIG.issuer,
    });

    return payload as JWTPayload;
  } catch {
    return null;
  }
}

async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function getUserById(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
