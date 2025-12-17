import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function AdminLayout() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.replace('/employee/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="employees" />
    </Stack>
  );
}
