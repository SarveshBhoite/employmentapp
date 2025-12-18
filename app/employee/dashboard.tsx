import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, User, Clock, PlayCircle, StopCircle, LogOut } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/auth-context';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);

  const { data: todayAttendance, refetch } =
    trpc.employee.getTodayAttendance.useQuery();

  const punchInMutation = trpc.employee.punchIn.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert('Success', 'Punched in successfully!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const punchOutMutation = trpc.employee.punchOut.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert('Success', 'Punched out successfully!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      if (todayAttendance?.punchIn && !todayAttendance?.punchOut) {
        const punchInTime = new Date(todayAttendance.punchIn);
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - punchInTime.getTime()) / 1000
        );
        setElapsedTime(elapsed);

        const autoPunchOutTime = new Date(punchInTime);
        autoPunchOutTime.setHours(18, 30, 0, 0);

        if (now >= autoPunchOutTime) {
          punchOutMutation.mutate();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [todayAttendance, punchOutMutation]);

  const handleLogout = async () => {
    await logout();
    router.replace('/employee/login');
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(secs).padStart(2, '0')}`;
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
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/employee/profile' as any)}
          >
            <User size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <LogOut size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.timeCard}>
          <Clock size={32} color={theme.colors.primary} />
          <Text style={styles.currentTime}>
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Text style={styles.currentDate}>
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {todayAttendance?.punchIn && !todayAttendance?.punchOut && (
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>Time Elapsed</Text>
            <Text style={styles.timerValue}>
              {formatElapsedTime(elapsedTime)}
            </Text>
          </View>
        )}

        <View style={styles.punchButtons}>
          {!todayAttendance?.punchIn ? (
            <TouchableOpacity
              style={[styles.punchButton, styles.punchInButton]}
              onPress={() => punchInMutation.mutate()}
              disabled={punchInMutation.isPending}
            >
              <PlayCircle size={40} color={theme.colors.white} />
              <Text style={styles.punchButtonText}>Punch In</Text>
            </TouchableOpacity>
          ) : !todayAttendance?.punchOut ? (
            <TouchableOpacity
              style={[styles.punchButton, styles.punchOutButton]}
              onPress={() => punchOutMutation.mutate()}
              disabled={punchOutMutation.isPending}
            >
              <StopCircle size={40} color={theme.colors.white} />
              <Text style={styles.punchButtonText}>Punch Out</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.completedCard}>
              <Text style={styles.completedText}>Work day completed!</Text>
              <Text style={styles.hoursText}>
                Total Hours: {todayAttendance.totalHours?.toFixed(2) || 0} hrs
              </Text>
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/employee/tasks' as any)}
          >
            <Text style={styles.actionTitle}>My Tasks</Text>
            <Text style={styles.actionDescription}>View assigned tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/employee/submit-report' as any)}
          >
            <Text style={styles.actionTitle}>Submit Report</Text>
            <Text style={styles.actionDescription}>Report your work</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/employee/attendance' as any)}
          >
            <Text style={styles.actionTitle}>Attendance</Text>
            <Text style={styles.actionDescription}>View your attendance</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.actionCard} onPress={handleLogout}>
            <Text style={styles.actionTitle}>Logout</Text>
            <Text style={styles.actionDescription}>Sign out</Text>
          </TouchableOpacity> */}
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
  timeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  currentDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  timerCard: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  timerLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  timerValue: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  punchButtons: {
    marginBottom: theme.spacing.lg,
  },
  punchButton: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  punchInButton: {
    backgroundColor: theme.colors.primary,
  },
  punchOutButton: {
    backgroundColor: theme.colors.error,
  },
  punchButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },
  completedCard: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  completedText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },
  hoursText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    marginTop: theme.spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    flex: 1,
    minWidth: '45%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  actionDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});
