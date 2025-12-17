import { Stack } from 'expo-router';

export default function EmployeeLayout() {
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
