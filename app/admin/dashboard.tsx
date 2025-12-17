import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Users, Calendar, ClipboardList, FileText, LogOut } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/auth-context';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [currentTime] = useState(new Date());

  const { data: overview } =
    trpc.admin.getTodayAttendanceOverview.useQuery();

  const markHolidayMutation = trpc.admin.markHoliday.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Holiday marked successfully!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleLogout = async () => {
    await logout();
    router.replace('/employee/login');
  };

  const handleMarkHoliday = () => {
    Alert.alert('Mark Holiday', 'Mark today as a holiday for all employees?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () =>
          markHolidayMutation.mutate({
            date: new Date(),
            description: 'Holiday',
          }),
      },
    ]);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.roleText}>Admin</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <LogOut size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Today&apos;s Attendance</Text>

          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {overview?.totalEmployees || 0}
              </Text>
              <Text style={styles.statLabel}>Total Employees</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                {overview?.presentToday || 0}
              </Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.error }]}>
                {overview?.absentToday || 0}
              </Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
          </View>

          <Button
            title="Mark Today as Holiday"
            onPress={handleMarkHoliday}
            variant="secondary"
            loading={markHolidayMutation.isPending}
            style={styles.holidayButton}
          />
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/attendance' as any)}
          >
            <Calendar size={28} color={theme.colors.white} />
            <Text style={styles.actionTitle}>Attendance</Text>
            <Text style={styles.actionDescription}>
              Manage employee attendance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/tasks' as any)}
          >
            <ClipboardList size={28} color={theme.colors.primary} />
            <Text style={styles.actionTitle}>Tasks</Text>
            <Text style={styles.actionDescription}>
              Create and manage tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/reports' as any)}
          >
            <FileText size={28} color={theme.colors.white} />
            <Text style={styles.actionTitle}>Reports</Text>
            <Text style={styles.actionDescription}>View employee reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/employees' as any)}
          >
            <Users size={28} color={theme.colors.white} />
            <Text style={styles.actionTitle}>Employees</Text>
            <Text style={styles.actionDescription}>
              Manage employee profiles
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  greeting: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  roleText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  iconButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  overviewCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  holidayButton: {
    marginTop: theme.spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flex: 1,
    minWidth: '45%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  actionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  actionDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});
