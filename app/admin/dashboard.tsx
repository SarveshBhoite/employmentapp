import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Users,
  Calendar,
  ClipboardList,
  FileText,
  LogOut,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/auth-context';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [currentTime] = useState(new Date());
  const [showAttendanceList, setShowAttendanceList] = useState(false);

  const { data: overview } =
    trpc.admin.getTodayAttendanceOverview.useQuery();

  const { data: attendanceList } =
    trpc.admin.getTodayAttendanceList.useQuery(undefined, {
      enabled: showAttendanceList,
    });

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
      {/* HEADER */}
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

      {/* CONTENT */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* TODAY ATTENDANCE CARD */}
        <View style={styles.overviewCard}>
          <View style={styles.attendanceHeader}>
            <Text style={styles.overviewTitle}>Today&apos;s Attendance</Text>
            <TouchableOpacity onPress={() => setShowAttendanceList(true)}>
              <Text style={styles.seeListText}>See List</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {overview?.totalEmployees || 0}
              </Text>
              <Text style={styles.statLabel}>Total Employees</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  { color: theme.colors.success },
                ]}
              >
                {overview?.presentToday || 0}
              </Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  { color: theme.colors.error },
                ]}
              >
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

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/attendance' as any)}
          >
            <Calendar size={28} color={theme.colors.primary} />
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
            <FileText size={28} color={theme.colors.primary} />
            <Text style={styles.actionTitle}>Reports</Text>
            <Text style={styles.actionDescription}>View employee reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/employees' as any)}
          >
            <Users size={28} color={theme.colors.primary} />
            <Text style={styles.actionTitle}>Employees</Text>
            <Text style={styles.actionDescription}>
              Manage employee profiles
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ATTENDANCE LIST MODAL */}
      <Modal
        visible={showAttendanceList}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAttendanceList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Today&apos;s Attendance</Text>

            <Text style={styles.sectionTitle}>Present</Text>
            {attendanceList?.present.map((p, index) => (
              <View key={index} style={styles.listRow}>
                <Text style={styles.nameText}>{p.name}</Text>
                <Text style={styles.timeText}>
                  {p.punchIn
                    ? new Date(p.punchIn).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--'}
                </Text>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Absent
            </Text>
            {attendanceList?.absent.map((a, index) => (
              <Text key={index} style={styles.nameText}>
                {a.name}
              </Text>
            ))}

            <Button
              title="Close"
              onPress={() => setShowAttendanceList(false)}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

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
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
  seeListText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: theme.spacing.lg,
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
  },
  actionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  actionDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  nameText: {
    fontSize: theme.fontSize.sm,
  },
  timeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
