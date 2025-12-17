import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';

export default function ReportsScreen() {
  const router = useRouter();
  const [searchName, setSearchName] = useState('');

  const { data: reports } = trpc.admin.getAllReports.useQuery({ searchName });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <Input
          placeholder="Search by employee name..."
          value={searchName}
          onChangeText={setSearchName}
          style={styles.searchInput}
        />
      </View>

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
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, { color: theme.colors.primary }]}>
                {item.status}
              </Text>
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: theme.spacing.lg + theme.spacing.md,
    top: theme.spacing.md + 28,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 36,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  reportCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  employeeName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reportDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  taskTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  summary: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statusValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
});
