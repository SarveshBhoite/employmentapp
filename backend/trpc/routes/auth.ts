import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '../create-context';
import { getDb } from '@/backend/db/mongodb';
import { User } from '@/backend/models/user';
import { signToken } from '@/backend/utils/jwt';
import { ObjectId } from 'mongodb';

export const authRouter = createTRPCRouter({
  /* ================= REGISTER ================= */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
        phone: z.string().optional(),
        address: z.string().optional(),
        position: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const usersCollection = db.collection<User>('users');

      const existingUser = await usersCollection.findOne({
        email: input.email,
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email already registered',
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const newUser: User = {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: 'employee',
        status: 'pending', // ✅ IMPORTANT
        phone: input.phone,
        address: input.address,
        position: input.position,
        salary: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
console.log('REGISTER USER PAYLOAD:', newUser);

      await usersCollection.insertOne(newUser);

      // ❌ DO NOT ISSUE TOKEN
      return {
        success: true,
        message: 'Registration successful. Awaiting admin approval.',
      };
    }),

  /* ================= LOGIN ================= */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const usersCollection = db.collection<User>('users');

      const user = await usersCollection.findOne({
        email: input.email,
      });

      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid credentials',
        });
      }

      const isValidPassword = await bcrypt.compare(
        input.password,
        user.password
      );

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid credentials',
        });
      }

      // 🚫 BLOCK UNAPPROVED EMPLOYEES
      if (user.role === 'employee' && user.status !== 'approved') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            user.status === 'pending'
              ? 'Your account is awaiting admin approval'
              : 'Your account has been rejected by admin',
        });
      }

      const token = signToken({
        userId: user._id!.toString(),
        email: user.email,
        role: user.role,
        status: user.status, // ✅ include
      });

      return {
        token,
        user: {
          _id: user._id!.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          phone: user.phone,
          address: user.address,
          position: user.position,
          salary: user.salary,
        },
      };
    }),

  /* ================= CHANGE PASSWORD ================= */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const usersCollection = db.collection<User>('users');

      const user = await usersCollection.findOne({
        _id: new ObjectId(ctx.user.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const isValid = await bcrypt.compare(
        input.currentPassword,
        user.password
      );

      if (!isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Current password is incorrect',
        });
      }

      const hashedNewPassword = await bcrypt.hash(input.newPassword, 10);

      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedNewPassword,
            updatedAt: new Date(),
          },
        }
      );

      return { success: true };
    }),
});
