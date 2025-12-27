import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
  if (user) {
    if (user.role === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      if (user.status === 'pending') {
        router.replace('/employee/pending');
      } else if (user.status === 'rejected') {
        router.replace('/employee/rejected');
      } else {
        router.replace('/employee/dashboard');
      }
    }
  } else {
    router.replace('/employee/login');
  }
    }
  }, [user, isLoading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0D7377" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
