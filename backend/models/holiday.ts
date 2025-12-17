import { ObjectId } from 'mongodb';

export interface Holiday {
  _id?: ObjectId;
  date: Date;
  description?: string;
  createdAt: Date;
}
