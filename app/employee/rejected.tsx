import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { Button } from '@/components/Button';
import { router } from 'expo-router';

export default function RejectedScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Access Rejected</Text>
        <Text style={styles.message}>
          Your registration request has been rejected by admin.
          {'\n\n'}
          Please contact management for more details.
        </Text>
        <Button
                  title="Back to Login"
                  onPress={() => router.replace('/employee/login')}
                  style={{ marginTop: theme.spacing.lg }}
                />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
