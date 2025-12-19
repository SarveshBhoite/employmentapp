import { ObjectId } from 'mongodb';

export interface Request {
  _id?: ObjectId;

  userId: ObjectId;

  category: 'leave' | 'wfh' | 'query' | 'complaint';

  message: string;

  fromDate?: Date;
  toDate?: Date;

  status: 'pending' | 'approved' | 'rejected' | 'replied';

  adminReply?: string;

  createdAt: Date;
  updatedAt: Date;
}
