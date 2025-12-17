import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDb } from '@/backend/db/mongodb';
import { User } from '@/backend/models/user';
import { signToken } from '@/backend/utils/jwt';

export const authRouter = createTRPCRouter({
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

      const existingUser = await usersCollection.findOne({ email: input.email });
      if (existingUser) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const newUser: User = {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: 'employee',
        phone: input.phone,
        address: input.address,
        position: input.position,
        salary: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);

      const token = signToken({
        userId: result.insertedId.toString(),
        email: newUser.email,
        role: newUser.role,
      });

      return {
        token,
        user: {
          _id: result.insertedId.toString(),
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          address: newUser.address,
          position: newUser.position,
          salary: newUser.salary,
        },
      };
    }),

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

      const user = await usersCollection.findOne({ email: input.email });
      if (!user) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(input.password, user.password);
      if (!isValidPassword) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid credentials' });
      }

      const token = signToken({
        userId: user._id!.toString(),
        email: user.email,
        role: user.role,
      });

      return {
        token,
        user: {
          _id: user._id!.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          address: user.address,
          position: user.position,
          salary: user.salary,
        },
      };
    }),
});
