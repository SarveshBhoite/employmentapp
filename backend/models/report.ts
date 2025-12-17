import { ObjectId } from 'mongodb';

export interface Report {
  _id?: ObjectId;
  userId: ObjectId;
  taskId: ObjectId;
  taskTitle: string;
  summary: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
