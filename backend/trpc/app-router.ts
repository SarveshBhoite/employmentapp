import { createTRPCRouter } from './create-context';
import { authRouter } from './routes/auth';
import { employeeRouter } from './routes/employee';
import { adminRouter } from './routes/admin';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  employee: employeeRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
