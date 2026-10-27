import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../config/db";
import { config } from "../config/env";
import { redis } from "../config/redis";

// Validation schemas
const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["candidate", "recruiter", "student"]).optional().default("candidate"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Token helpers
const generateTokens = (user: { id: string; email: string; role: string }) => {
  const payload = { userId: user.id, email: user.email, role: user.role };
  
  const accessToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign({ userId: user.id, email: user.email }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as any,
  });

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { fullName, email, password, role } = validatedData;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const insertResult = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, created_at`,
      [fullName, normalizedEmail, passwordHash, role]
    );

    const newUser = insertResult.rows[0];

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Save refresh token in DB
    await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, newUser.id]);

    // Cache session in Redis if connected
    if (redis) {
      try {
        await redis.set(`session:${newUser.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);
      } catch (redisErr) {
        console.warn("Could not cache session in Redis:", redisErr);
      }
    }

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: {
          id: newUser.id,
          fullName: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const result = await pool.query(
      "SELECT id, full_name, email, role, password_hash FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Update refresh token in DB
    await pool.query("UPDATE users SET refresh_token = $1, updated_at = NOW() WHERE id = $2", [
      refreshToken,
      user.id,
    ]);

    // Cache session in Redis if connected
    if (redis) {
      try {
        await redis.set(`session:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);
      } catch (redisErr) {
        console.warn("Could not cache session in Redis:", redisErr);
      }
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = refreshSchema.parse(req.body);
    const { refreshToken } = validatedData;

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    } catch (err) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
      return;
    }

    // Verify token exists in database or Redis
    const userResult = await pool.query(
      "SELECT id, full_name, email, role, refresh_token FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const user = userResult.rows[0];

    if (user.refresh_token !== refreshToken) {
      res.status(403).json({
        success: false,
        message: "Refresh token is invalid or has been revoked",
      });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Update refresh token
    await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
      tokens.refreshToken,
      user.id,
    ]);

    if (redis) {
      try {
        await redis.set(`session:${user.id}`, tokens.refreshToken, "EX", 7 * 24 * 60 * 60);
      } catch (redisErr) {
        console.warn("Could not update Redis session:", redisErr);
      }
    }

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      "SELECT id, full_name, email, role, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
