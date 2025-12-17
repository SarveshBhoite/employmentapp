import { ObjectId } from 'mongodb';

export interface Task {
  _id?: ObjectId;
  title: string;
  description: string;
  assignedTo: ObjectId[];
  createdBy: ObjectId;
  status: 'ongoing' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
