import { Stack } from 'expo-router';

export default function AdminLayout() {
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
