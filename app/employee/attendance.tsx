import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';

export default function AttendanceScreen() {
  const router = useRouter();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: attendance } = trpc.employee.getMyAttendance.useQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: number) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Attendance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.monthButton}>
            <ChevronLeft size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {monthNames[selectedMonth - 1]} {selectedYear}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.monthButton}>
            <ChevronRight size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.success }]}>
            <Text style={styles.summaryValue}>{attendance?.presentDays || 0}</Text>
            <Text style={styles.summaryLabel}>Present Days</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.summaryValue}>{attendance?.absentDays || 0}</Text>
            <Text style={styles.summaryLabel}>Absent Days</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.summaryValue}>{attendance?.sundays || 0}</Text>
            <Text style={styles.summaryLabel}>Sundays</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.accent }]}>
            <Text style={styles.summaryValue}>{attendance?.holidays || 0}</Text>
            <Text style={styles.summaryLabel}>Holidays</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Attendance Records</Text>
          {attendance?.attendances && attendance.attendances.length > 0 ? (
            attendance.attendances.map((record) => (
              <View key={record._id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>
                    {new Date(record.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: record.status === 'present' ? theme.colors.success : theme.colors.error },
                    ]}
                  >
                    <Text style={styles.statusText}>{record.status}</Text>
                  </View>
                </View>
                <View style={styles.recordDetails}>
                  <Text style={styles.recordTime}>
                    In: {record.punchIn ? new Date(record.punchIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </Text>
                  <Text style={styles.recordTime}>
                    Out: {record.punchOut ? new Date(record.punchOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </Text>
                  <Text style={styles.recordHours}>
                    {record.totalHours ? `${record.totalHours.toFixed(2)} hrs` : '-'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No attendance records for this month</Text>
            </View>
          )}
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
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  monthButton: {
    padding: theme.spacing.sm,
  },
  monthText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.white,
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },
  detailsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  recordCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  recordDate: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  recordHours: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
});
