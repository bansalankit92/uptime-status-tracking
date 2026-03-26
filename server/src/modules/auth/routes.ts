import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../../db/connection.js';
import { users } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { config } from '../../config.js';
import { validate } from '../../middleware/validate.js';
import { authMiddleware, AuthPayload } from '../../middleware/auth.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const router = Router();

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = db.select().from(users).where(eq(users.email, email)).get();

  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
  });
});

router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const user = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
  }).from(users).where(eq(users.id, req.user!.userId)).get();

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({ success: true, data: user });
});

export const authRoutes = router;
