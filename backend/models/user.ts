import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'employee';
  status: 'pending' | 'approved' | 'rejected';
  phone?: string;
  address?: string;
  position?: string;
  salary?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  status: 'pending' | 'approved' | 'rejected';
  phone?: string;
  address?: string;
  position?: string;
  salary?: number;
}
