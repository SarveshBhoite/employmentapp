import { ObjectId } from 'mongodb';

export interface Report {
  _id?: ObjectId;
  userId: ObjectId;

  // optional → allows "Other" reports
  taskId?: ObjectId | null;
  taskTitle?: string | null;

  summary: string;
  status: 'ongoing' | 'in_progress' | 'completed';

  createdAt: Date;
  updatedAt: Date;
}
