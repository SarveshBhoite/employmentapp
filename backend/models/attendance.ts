import { ObjectId } from 'mongodb';

export interface Attendance {
  _id?: ObjectId;
  userId: ObjectId;
  date: Date;
  punchIn?: Date;
  punchOut?: Date;
  totalHours?: number;
  status: 'present' | 'absent';
  createdAt: Date;
  updatedAt: Date;
}
