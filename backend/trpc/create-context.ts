import { initTRPC, TRPCError } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { verifyToken, JWTPayload } from '../utils/jwt';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('authorization');
  let user: JWTPayload | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      user = verifyToken(token);
    } catch (error) {
      console.log('Invalid token:', error);
    }
  }

  return {
    req: opts.req,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/* ================= PROTECTED ================= */

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }

  // 🔒 Re-narrow user type (VERY IMPORTANT)
  const user = ctx.user as JWTPayload;

  // 🚫 Block unapproved employees
  if (user.role === 'employee' && user.status !== 'approved') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your account is pending admin approval',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

/* ================= ADMIN ================= */

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  return next({ ctx });
});
