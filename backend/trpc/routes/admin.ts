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
  getTodayAttendanceOverview: adminProcedure.query(async () => {
    const db = await getDb();
    const attendanceCollection = db.collection<Attendance>('attendance');
    const usersCollection = db.collection<User>('users');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEmployees = await usersCollection.countDocuments({ role: 'employee' });
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
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Holiday already marked for this date' });
      }

      await holidaysCollection.insertOne({
        date: holidayDate,
        description: input.description,
        createdAt: new Date(),
      });

      return { success: true };
    }),

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

      const user = await usersCollection.findOne({ _id: new ObjectId(input.userId) });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const attendances = await attendanceCollection
        .find({
          userId: new ObjectId(input.userId),
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

  getAllEmployees: adminProcedure.query(async () => {
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const employees = await usersCollection.find({ role: 'employee' }).toArray();

    return employees.map((emp) => ({
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
    .input(
      z.object({
        userId: z.string(),
        salary: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const usersCollection = db.collection<User>('users');

      await usersCollection.updateOne(
        { _id: new ObjectId(input.userId) },
        {
          $set: {
            salary: input.salary,
            updatedAt: new Date(),
          },
        }
      );

      return { success: true };
    }),

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
      const tasksCollection = db.collection<Task>('tasks');

      const newTask: Task = {
        title: input.title,
        description: input.description,
        assignedTo: input.assignedTo.map((id) => new ObjectId(id)),
        createdBy: new ObjectId(ctx.user.userId),
        status: 'ongoing',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await tasksCollection.insertOne(newTask);

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
      const tasksCollection = db.collection<Task>('tasks');
      const usersCollection = db.collection<User>('users');

      const filter: any = {};
      if (input.status && input.status !== 'all') {
        filter.status = input.status;
      }
      if (input.startDate && input.endDate) {
        filter.createdAt = { $gte: input.startDate, $lte: input.endDate };
      }

      const tasks = await tasksCollection.find(filter).sort({ createdAt: -1 }).toArray();

      const tasksWithDetails = await Promise.all(
        tasks.map(async (task) => {
          const creator = await usersCollection.findOne({ _id: task.createdBy });
          const assignedUsers = await usersCollection
            .find({ _id: { $in: task.assignedTo } })
            .toArray();

          return {
            _id: task._id!.toString(),
            title: task.title,
            description: task.description,
            status: task.status,
            createdBy: creator?.name || 'Unknown',
            assignedTo: assignedUsers.map((u) => ({ _id: u._id!.toString(), name: u.name })),
            createdAt: task.createdAt,
          };
        })
      );

      return tasksWithDetails;
    }),

    getAllReports: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        searchName: z.string().optional(),
        status: z.enum(['ongoing', 'in_progress', 'completed']).optional(), // ✅ ADDED
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const reportsCollection = db.collection<Report>('reports');
      const usersCollection = db.collection<User>('users');

      // --- USER FILTER (for name search) ---
      const userFilter: any = {};
      if (input.searchName) {
        userFilter.name = { $regex: input.searchName, $options: 'i' };
      }

      const users = await usersCollection.find(userFilter).toArray();
      const userIds = users.map((u) => u._id);

      // --- REPORT FILTER ---
      const reportFilter: any = {
        userId: { $in: userIds },
      };

      if (input.status) {
        reportFilter.status = input.status; // ✅ STATUS FILTER
      }

      if (input.startDate && input.endDate) {
        reportFilter.createdAt = {
          $gte: input.startDate,
          $lte: input.endDate,
        };
      }

      const reports = await reportsCollection
        .find(reportFilter)
        .sort({ createdAt: -1 })
        .toArray();

      const reportsWithDetails = await Promise.all(
        reports.map(async (report) => {
          const user = await usersCollection.findOne({ _id: report.userId });
          return {
            _id: report._id!.toString(),
            employeeName: user?.name || 'Unknown',
            taskTitle: report.taskTitle,
            summary: report.summary,
            status: report.status,
            createdAt: report.createdAt,
          };
        })
      );

      return reportsWithDetails;
    }),
  getTodayAttendanceList: adminProcedure.query(async () => {
  const db = await getDb();
  const attendanceCollection = db.collection<Attendance>('attendance');
  const usersCollection = db.collection<User>('users');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all employees
  const employees = await usersCollection
    .find({ role: 'employee' })
    .toArray();

  // Fetch today's attendance
  const attendanceRecords = await attendanceCollection
    .find({ date: today })
    .toArray();

  const attendanceMap = new Map(
    attendanceRecords.map((a) => [a.userId.toString(), a])
  );

  const present: { name: string; punchIn?: Date }[] = [];
  const absent: { name: string }[] = [];

  for (const emp of employees) {
    const record = attendanceMap.get(emp._id!.toString());

    if (record && record.status === 'present') {
      present.push({
        name: emp.name,
        punchIn: record.punchIn,
      });
    } else {
      absent.push({
        name: emp.name,
      });
    }
  }

  return {
    present,
    absent,
  };
}),
/* ================= ADMIN REQUEST MANAGEMENT ================= */

getAllRequests: adminProcedure
  .input(
    z.object({
      searchName: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const db = await getDb();
    const requestsCollection = db.collection<Request>('requests');
    const usersCollection = db.collection<User>('users');

    let userFilter: any = {};
    if (input.searchName) {
      userFilter.name = { $regex: input.searchName, $options: 'i' };
    }

    const users = await usersCollection.find(userFilter).toArray();
    const userMap = new Map(users.map((u) => [u._id!.toString(), u.name]));

    const requests = await requestsCollection
      .find({
        userId: { $in: users.map((u) => u._id!) },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return requests.map((r) => ({
      _id: r._id!.toString(),
      employeeName: userMap.get(r.userId.toString()) || 'Unknown',
      category: r.category,
      message: r.message,
      fromDate: r.fromDate,
      toDate: r.toDate,
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

    const request = await requestsCollection.findOne({
      _id: new ObjectId(input.requestId),
    });

    if (!request) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Request not found' });
    }

    // Update request itself
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

    // ✅ Only process attendance for approved leave / wfh
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

  getPendingEmployees: adminProcedure.query(async () => {
  const db = await getDb();
  const usersCollection = db.collection<User>('users');

  const users = await usersCollection
    .find({ role: 'employee', status: 'pending' })
    .sort({ createdAt: -1 })
    .toArray();

  return users.map((u) => ({
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
    const usersCollection = db.collection<User>('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(input.userId) },
      {
        $set: {
          status: input.status,
          updatedAt: new Date(),
        },
      }
    );

    if (!result.matchedCount) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return { success: true };
  }),



  })