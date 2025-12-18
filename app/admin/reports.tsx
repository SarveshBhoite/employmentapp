import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';

const STATUS_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Completed', value: 'completed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Ongoing', value: 'ongoing' },
] as const;

export default function ReportsScreen() {
  const router = useRouter();
  const [searchName, setSearchName] = useState('');
  const [status, setStatus] = useState<
    'completed' | 'in_progress' | 'ongoing' | undefined
  >(undefined);

  const { data: reports } = trpc.admin.getAllReports.useQuery({
    searchName,
    status,
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <Input
          placeholder="Search by employee name..."
          value={searchName}
          onChangeText={setSearchName}
          style={styles.searchInput}
        />
      </View>

      {/* STATUS FILTER */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.filterChip,
              status === item.value && styles.filterChipActive,
            ]}
            onPress={() => setStatus(item.value)}
          >
            <Text
              style={[
                styles.filterText,
                status === item.value && styles.filterTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* REPORT LIST */}
      <FlatList
        data={reports || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.employeeName}>{item.employeeName}</Text>
              <Text style={styles.reportDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <Text style={styles.taskTitle}>{item.taskTitle}</Text>
            <Text style={styles.summary}>{item.summary}</Text>

            <Text style={styles.status}>
              Status: <Text style={styles.statusValue}>{item.status}</Text>
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reports found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.surface },
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
  backButton: { padding: theme.spacing.sm },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },

  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  searchIcon: { position: 'absolute', left: 32, top: 38 },
  searchInput: { paddingLeft: 36 },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  filterTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },

  listContent: { padding: theme.spacing.lg },
  reportCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  employeeName: { fontWeight: '600', fontSize: theme.fontSize.md },
  reportDate: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  taskTitle: {
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  summary: { color: theme.colors.textSecondary, marginBottom: 6 },
  status: { fontSize: theme.fontSize.sm },
  statusValue: { fontWeight: '600' },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: theme.colors.textSecondary },
});
