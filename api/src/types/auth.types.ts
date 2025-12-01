import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: User;
}
