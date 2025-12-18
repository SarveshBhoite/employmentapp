import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Edit } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';

export default function EmployeesScreen() {
  const router = useRouter();
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [newSalary, setNewSalary] = useState('');
  const [search, setSearch] = useState('');


  const { data: employees, refetch } = trpc.admin.getAllEmployees.useQuery();
  const filteredEmployees = (employees || []).filter((emp) =>
  emp.name.toLowerCase().includes(search.toLowerCase())
);


  const updateSalaryMutation = trpc.admin.updateEmployeeSalary.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Salary updated successfully!');
      setShowSalaryModal(false);
      setSelectedEmployee(null);
      setNewSalary('');
      refetch();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleUpdateSalary = () => {
    if (!newSalary || isNaN(Number(newSalary))) {
      Alert.alert('Error', 'Please enter a valid salary amount');
      return;
    }
    updateSalaryMutation.mutate({
      userId: selectedEmployee._id,
      salary: Number(newSalary),
    });
  };

  const openSalaryModal = (employee: any) => {
    setSelectedEmployee(employee);
    setNewSalary(employee.salary?.toString() || '0');
    setShowSalaryModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employees</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
  <Input
    placeholder="Search employee by name..."
    value={search}
    onChangeText={setSearch}
  />
</View>


      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.employeeCard}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{item.name}</Text>
                <Text style={styles.employeeEmail}>{item.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openSalaryModal(item)}
              >
                <Edit size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Position</Text>
                <Text style={styles.detailValue}>{item.position || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{item.phone || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.salaryContainer}>
              <Text style={styles.salaryLabel}>Salary</Text>
              <Text style={styles.salaryValue}>₹{item.salary || 0}</Text>
            </View>

            {item.address && (
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>Address</Text>
                <Text style={styles.addressValue}>{item.address}</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No employees found</Text>
          </View>
        }
      />

      <Modal visible={showSalaryModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Salary</Text>
              <TouchableOpacity onPress={() => setShowSalaryModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.employeeNameModal}>{selectedEmployee?.name}</Text>
              <Input
                label="New Salary (₹)"
                placeholder="Enter salary amount"
                value={newSalary}
                onChangeText={setNewSalary}
                keyboardType="numeric"
              />
              <Button
                title="Update Salary"
                onPress={handleUpdateSalary}
                loading={updateSalaryMutation.isPending}
                style={styles.updateButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  listContent: {
    padding: theme.spacing.lg,
  },
  employeeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.white,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  editButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '500',
  },
  salaryContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  salaryLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  salaryValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  addressContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  addressLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  addressValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: theme.colors.textSecondary,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  employeeNameModal: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  updateButton: {
    marginTop: theme.spacing.md,
  },
  searchContainer: {
  paddingHorizontal: theme.spacing.lg,
  paddingTop: theme.spacing.md,
},
});
