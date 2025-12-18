import * as z from 'zod';
import { TRPCError } from '@trpc/server';
import { ObjectId } from 'mongodb';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { getDb } from '@/backend/db/mongodb';
import { Attendance } from '@/backend/models/attendance';
import { Task } from '@/backend/models/task';
import { Report } from '@/backend/models/report';
import { Holiday } from '@/backend/models/holiday';
import { User } from '@/backend/models/user';

export const employeeRouter = createTRPCRouter({
  punchIn: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    const attendanceCollection = db.collection<Attendance>('attendance');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await attendanceCollection.findOne({
      userId: new ObjectId(ctx.user.userId),
      date: today,
    });

    if (existingAttendance && existingAttendance.punchIn) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already punched in today' });
    }

    const now = new Date();

    if (existingAttendance) {
      await attendanceCollection.updateOne(
        { _id: existingAttendance._id },
        {
          $set: {
            punchIn: now,
            status: 'present',
            updatedAt: now,
          },
        }
      );
    } else {
      await attendanceCollection.insertOne({
        userId: new ObjectId(ctx.user.userId),
        date: today,
        punchIn: now,
        status: 'present',
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, punchIn: now };
  }),

  punchOut: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    const attendanceCollection = db.collection<Attendance>('attendance');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await attendanceCollection.findOne({
      userId: new ObjectId(ctx.user.userId),
      date: today,
    });

    if (!attendance || !attendance.punchIn) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No punch in record found' });
    }

    if (attendance.punchOut) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already punched out today' });
    }

    const now = new Date();
    const totalHours = (now.getTime() - attendance.punchIn.getTime()) / (1000 * 60 * 60);

    await attendanceCollection.updateOne(
      { _id: attendance._id },
      {
        $set: {
          punchOut: now,
          totalHours: Math.round(totalHours * 100) / 100,
          updatedAt: now,
        },
      }
    );

    return { success: true, punchOut: now, totalHours: Math.round(totalHours * 100) / 100 };
  }),

  getTodayAttendance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const attendanceCollection = db.collection<Attendance>('attendance');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await attendanceCollection.findOne({
      userId: new ObjectId(ctx.user.userId),
      date: today,
    });

    return attendance
      ? {
          _id: attendance._id!.toString(),
          punchIn: attendance.punchIn,
          punchOut: attendance.punchOut,
          totalHours: attendance.totalHours,
          status: attendance.status,
        }
      : null;
  }),

  getMyTasks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const tasksCollection = db.collection<Task>('tasks');
    const usersCollection = db.collection<User>('users');

    const tasks = await tasksCollection
      .find({
        assignedTo: new ObjectId(ctx.user.userId),
      })
      .sort({ createdAt: -1 })
      .toArray();

    const tasksWithCreator = await Promise.all(
      tasks.map(async (task) => {
        const creator = await usersCollection.findOne({ _id: task.createdBy });
        return {
          _id: task._id!.toString(),
          title: task.title,
          description: task.description,
          status: task.status,
          createdBy: creator?.name || 'Unknown',
          createdAt: task.createdAt,
        };
      })
    );

    return tasksWithCreator;
  }),

  submitReport: protectedProcedure
  .input(
    z.object({
      taskId: z
        .string()
        .optional()
        .transform((v) => (v && v.length > 0 ? v : undefined)),

      taskTitle: z
        .string()
        .optional()
        .transform((v) => (v && v.length > 0 ? v : undefined)),

      summary: z.string().min(1),
      status: z.enum(['ongoing', 'in_progress', 'completed']),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    const reportsCollection = db.collection<Report>('reports');
    const tasksCollection = db.collection<Task>('tasks');

    const now = new Date();

    const newReport: Report = {
      userId: new ObjectId(ctx.user.userId),
      summary: input.summary,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };

    if (input.taskId) {
      const taskObjectId = new ObjectId(input.taskId);

      const task = await tasksCollection.findOne({
        _id: taskObjectId,
        assignedTo: new ObjectId(ctx.user.userId),
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found or not assigned to you',
        });
      }

      newReport.taskId = taskObjectId;
      newReport.taskTitle = task.title;

      await tasksCollection.updateOne(
        { _id: taskObjectId },
        {
          $set: {
            status: input.status,
            updatedAt: now,
          },
        }
      );
    }

    if (!input.taskId && input.taskTitle) {
      newReport.taskTitle = input.taskTitle;
    }

    await reportsCollection.insertOne(newReport);
    return { success: true };
  }),



  getMyAttendance: protectedProcedure
    .input(
      z.object({
        month: z.number(),
        year: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const attendanceCollection = db.collection<Attendance>('attendance');
      const holidaysCollection = db.collection<Holiday>('holidays');

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const attendances = await attendanceCollection
        .find({
          userId: new ObjectId(ctx.user.userId),
          date: { $gte: startDate, $lte: endDate },
        })
        .sort({ date: -1 })
        .toArray();

      const holidays = await holidaysCollection
        .find({
          date: { $gte: startDate, $lte: endDate },
        })
        .toArray();

      let sundays = 0;
      const daysInMonth = endDate.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(input.year, input.month - 1, i);
        if (date.getDay() === 0) {
          sundays++;
        }
      }

      const presentDays = attendances.filter((a) => a.status === 'present').length;
      const absentDays = Math.max(0, daysInMonth - presentDays - sundays - holidays.length);

      return {
        presentDays,
        absentDays,
        sundays,
        holidays: holidays.length,
        attendances: attendances.map((a) => ({
          _id: a._id!.toString(),
          date: a.date,
          punchIn: a.punchIn,
          punchOut: a.punchOut,
          totalHours: a.totalHours,
          status: a.status,
        })),
      };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        phone: z.string().optional(),
        address: z.string().optional(),
        position: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const usersCollection = db.collection<User>('users');

      await usersCollection.updateOne(
        { _id: new ObjectId(ctx.user.userId) },
        {
          $set: {
            name: input.name,
            phone: input.phone,
            address: input.address,
            position: input.position,
            updatedAt: new Date(),
          },
        }
      );

      return { success: true };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(ctx.user.userId) });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return {
      _id: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      address: user.address,
      position: user.position,
      salary: user.salary,
    };
  }),
});
