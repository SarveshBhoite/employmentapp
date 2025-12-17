import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function EmployeeLayout() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'employee')) {
      router.replace('/employee/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="submit-report" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
