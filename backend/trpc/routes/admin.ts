import * as z from 'zod';
import { TRPCError } from '@trpc/server';
import { ObjectId } from 'mongodb';
import { createTRPCRouter, adminProcedure } from '../create-context';
import { getDb } from '@/backend/db/mongodb';
import { Attendance } from '@/backend/models/attendance';
import { Task } from '@/backend/models/task';
import { Report } from '@/backend/models/report';
import { Holiday } from '@/backend/models/holiday';
import { User } from '@/backend/models/user';
import { Request } from '@/backend/models/request';

export const adminRouter = createTRPCRouter({
  /* ================= DASHBOARD ================= */

  getTodayAttendanceOverview: adminProcedure.query(async () => {
    const db = await getDb();
    const attendanceCollection = db.collection<Attendance>('attendance');
    const usersCollection = db.collection<User>('users');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEmployees = await usersCollection.countDocuments({
      role: 'employee',
      status: 'approved',
    });

    const presentToday = await attendanceCollection.countDocuments({
      date: today,
      status: 'present',
    });

    return {
      totalEmployees,
      presentToday,
      absentToday: totalEmployees - presentToday,
    };
  }),

  /* ================= HOLIDAYS ================= */

  markHoliday: adminProcedure
    .input(
      z.object({
        date: z.date(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const holidaysCollection = db.collection<Holiday>('holidays');

      const holidayDate = new Date(input.date);
      holidayDate.setHours(0, 0, 0, 0);

      const existing = await holidaysCollection.findOne({ date: holidayDate });
      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Holiday already marked for this date',
        });
      }

      await holidaysCollection.insertOne({
        date: holidayDate,
        description: input.description,
        createdAt: new Date(),
      });

      return { success: true };
    }),

  /* ================= ATTENDANCE ================= */

  getEmployeeAttendance: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        month: z.number(),
        year: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const attendanceCollection = db.collection<Attendance>('attendance');
      const holidaysCollection = db.collection<Holiday>('holidays');
      const usersCollection = db.collection<User>('users');

      const user = await usersCollection.findOne({
        _id: new ObjectId(input.userId),
        status: 'approved',
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Approved employee not found',
        });
      }

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const attendances = await attendanceCollection
        .find({
          userId: user._id!,
          date: { $gte: startDate, $lte: endDate },
        })
        .sort({ date: -1 })
        .toArray();

      const holidays = await holidaysCollection
        .find({ date: { $gte: startDate, $lte: endDate } })
        .toArray();

      let sundays = 0;
      const daysInMonth = endDate.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(input.year, input.month - 1, i);
        if (d.getDay() === 0) sundays++;
      }

      const presentDays = attendances.filter(a => a.status === 'present').length;
      const absentDays = Math.max(
        0,
        daysInMonth - presentDays - sundays - holidays.length
      );

      const payableDays = presentDays + sundays + holidays.length;
      const salary = user.salary || 0;
      const calculatedSalary = (salary / daysInMonth) * payableDays;

      return {
        presentDays,
        absentDays,
        sundays,
        holidays: holidays.length,
        baseSalary: salary,
        calculatedSalary: Math.round(calculatedSalary * 100) / 100,
        attendances: attendances.map(a => ({
          _id: a._id!.toString(),
          date: a.date,
          punchIn: a.punchIn,
          punchOut: a.punchOut,
          totalHours: a.totalHours,
          status: a.status,
        })),
      };
    }),

  getTodayAttendanceList: adminProcedure.query(async () => {
    const db = await getDb();
    const attendanceCollection = db.collection<Attendance>('attendance');
    const usersCollection = db.collection<User>('users');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employees = await usersCollection
      .find({ role: 'employee', status: 'approved' })
      .toArray();

    const attendanceRecords = await attendanceCollection
      .find({ date: today })
      .toArray();

    const map = new Map(attendanceRecords.map(a => [a.userId.toString(), a]));

    const present = [];
    const absent = [];

    for (const emp of employees) {
      const record = map.get(emp._id!.toString());
      if (record && record.status === 'present') {
        present.push({ name: emp.name, punchIn: record.punchIn });
      } else {
        absent.push({ name: emp.name });
      }
    }

    return { present, absent };
  }),

  /* ================= EMPLOYEES ================= */

  getAllEmployees: adminProcedure.query(async () => {
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const employees = await usersCollection.find({
      role: 'employee',
      status: 'approved',
    }).toArray();

    return employees.map(emp => ({
      _id: emp._id!.toString(),
      email: emp.email,
      name: emp.name,
      phone: emp.phone,
      address: emp.address,
      position: emp.position,
      salary: emp.salary,
    }));
  }),

  updateEmployeeSalary: adminProcedure
    .input(z.object({ userId: z.string(), salary: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const usersCollection = db.collection<User>('users');

      await usersCollection.updateOne(
        { _id: new ObjectId(input.userId), status: 'approved' },
        { $set: { salary: input.salary, updatedAt: new Date() } }
      );

      return { success: true };
    }),

  /* ================= TASKS ================= */

  createTask: adminProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        assignedTo: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const usersCollection = db.collection<User>('users');

      const validUsers = await usersCollection.find({
        _id: { $in: input.assignedTo.map(id => new ObjectId(id)) },
        status: 'approved',
      }).toArray();

      const task: Task = {
        title: input.title,
        description: input.description,
        assignedTo: validUsers.map(u => u._id!),
        createdBy: new ObjectId(ctx.user.userId),
        status: 'ongoing',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection<Task>('tasks').insertOne(task);
      return { success: true };
    }),

  getTasks: adminProcedure
    .input(
      z.object({
        status: z.enum(['all', 'ongoing', 'in_progress', 'completed']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const tasks = await db.collection<Task>('tasks').find(
        input.status && input.status !== 'all'
          ? { status: input.status }
          : {}
      ).toArray();

      return tasks.map(t => ({
        _id: t._id!.toString(),
        title: t.title,
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
      }));
    }),

  /* ================= REPORTS ================= */

  getAllReports: adminProcedure
    .input(
      z.object({
        searchName: z.string().optional(),
        status: z.enum(['ongoing', 'in_progress', 'completed']).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const usersCollection = db.collection<User>('users');

      const users = await usersCollection.find({
        role: 'employee',
        status: 'approved',
        ...(input.searchName && {
          name: { $regex: input.searchName, $options: 'i' },
        }),
      }).toArray();

      const reports = await db.collection<Report>('reports').find({
        userId: { $in: users.map(u => u._id!) },
        ...(input.status && { status: input.status }),
      }).toArray();

      return reports.map(r => ({
        _id: r._id!.toString(),
        employeeName: users.find(u => u._id!.equals(r.userId))?.name || 'Unknown',
        taskTitle: r.taskTitle,
        summary: r.summary,
        status: r.status,
        createdAt: r.createdAt,
      }));
    }),

  /* ================= REQUESTS ================= */

  getAllRequests: adminProcedure.query(async () => {
    const db = await getDb();
    const users = await db.collection<User>('users').find({
      role: 'employee',
      status: 'approved',
    }).toArray();

    const requests = await db.collection<Request>('requests').find({
      userId: { $in: users.map(u => u._id!) },
    }).toArray();

    return requests.map(r => ({
      _id: r._id!.toString(),
      employeeName: users.find(u => u._id!.equals(r.userId))?.name || 'Unknown',
      category: r.category,
      message: r.message,
      status: r.status,
      adminReply: r.adminReply,
      createdAt: r.createdAt,
    }));
  }),

  updateRequestStatus: adminProcedure
  .input(
    z.object({
      requestId: z.string(),
      status: z.enum(['approved', 'rejected', 'replied']),
      adminReply: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    const db = await getDb();
    const requestsCollection = db.collection<Request>('requests');
    const attendanceCollection = db.collection<Attendance>('attendance');
    const usersCollection = db.collection<User>('users');

    const request = await requestsCollection.findOne({
      _id: new ObjectId(input.requestId),
    });

    if (!request) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Request not found',
      });
    }

    // ✅ Ensure request belongs to an APPROVED employee
    const employee = await usersCollection.findOne({
      _id: request.userId,
      role: 'employee',
      status: 'approved',
    });

    if (!employee) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Request belongs to unapproved employee',
      });
    }

    // ✅ Update request itself
    await requestsCollection.updateOne(
      { _id: request._id },
      {
        $set: {
          status: input.status,
          adminReply: input.adminReply,
          updatedAt: new Date(),
        },
      }
    );

    // ✅ Handle leave / WFH attendance
    if (
      input.status === 'approved' &&
      (request.category === 'leave' || request.category === 'wfh') &&
      request.fromDate &&
      request.toDate
    ) {
      const start = new Date(request.fromDate);
      const end = new Date(request.toDate);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      for (
        let d = new Date(start);
        d <= end;
        d.setDate(d.getDate() + 1)
      ) {
        const date = new Date(d);

        await attendanceCollection.updateOne(
          {
            userId: request.userId,
            date,
          },
          {
            $set: {
              userId: request.userId,
              date,
              status: request.category === 'wfh' ? 'present' : 'absent',
              workType: request.category === 'wfh' ? 'wfh' : 'leave',
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
    }

    return { success: true };
  }),


  /* ================= EMPLOYEE APPROVAL ================= */

  getPendingEmployees: adminProcedure.query(async () => {
    const db = await getDb();
    const users = await db.collection<User>('users').find({
      role: 'employee',
      status: 'pending',
    }).toArray();

    return users.map(u => ({
      _id: u._id!.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      position: u.position,
      createdAt: u.createdAt,
    }));
  }),

  updateEmployeeStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        status: z.enum(['approved', 'rejected']),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      await db.collection<User>('users').updateOne(
        { _id: new ObjectId(input.userId) },
        { $set: { status: input.status, updatedAt: new Date() } }
      );

      return { success: true };
    }),
});
