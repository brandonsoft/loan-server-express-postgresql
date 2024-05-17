import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername } from '../models/user';
import dotenv from 'dotenv';

dotenv.config();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await findUserByUsername(username);
    if (user) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const newUser = await createUser(username, hash);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error registering newuser', error });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (isMatch) {
      const payload = { id: user.id, username: user.username };
      const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

      res.json({
        success: true,
        token: 'Bearer ' + token
      });
    } else {
      res.status(400).json({ message: 'Password incorrect' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error during authentication', error });
  }
};