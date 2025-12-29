import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Filter } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { LightDropdown } from '@/components/LightDropdown';

/* ================= TYPES ================= */

type AssignedUser = {
  _id: string;
  name: string;
};

type AdminTask = {
  _id: string;
  title: string;
  description: string;
  status: 'ongoing' | 'in_progress' | 'completed';
  createdAt: Date;
  assignedTo?: AssignedUser[];
};

/* ================= SCREEN ================= */

export default function TasksManagementScreen() {
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'ongoing' | 'in_progress' | 'completed'
  >('all');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  /* ================= API ================= */

  const { data: employees = [] } =
    trpc.admin.getAllEmployees.useQuery();

  const { data: tasks = [], refetch } =
    trpc.admin.getTasks.useQuery({ status: selectedStatus });

  const createTaskMutation = trpc.admin.createTask.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Task created successfully!');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setSelectedEmployees([]);
      refetch();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  /* ================= HANDLERS ================= */

  const handleCreateTask = () => {
    if (!title || !description || selectedEmployees.length === 0) {
      Alert.alert(
        'Error',
        'Please fill all fields and select at least one employee'
      );
      return;
    }

    createTaskMutation.mutate({
      title,
      description,
      assignedTo: selectedEmployees,
    });
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId]
    );
  };

  const getStatusColor = (status: AdminTask['status']) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'in_progress':
        return '#FFA500';
      case 'ongoing':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: AdminTask['status']) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'ongoing':
        return 'Ongoing';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Task Management</Text>

        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={styles.addButton}
        >
          <Plus size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {/* FILTER */}
      <View style={styles.filterBar}>
  <Filter size={20} color={theme.colors.primary} />

  <LightDropdown
    value={selectedStatus}
    onChange={(v) => setSelectedStatus(v as any)}
    options={[
      { label: 'All Tasks', value: 'all' },
      { label: 'Ongoing', value: 'ongoing' },
      { label: 'In Progress', value: 'in_progress' },
      { label: 'Completed', value: 'completed' },
    ]}
  />
</View>

      {/* TASK LIST */}
      <FlatList
        data={tasks as AdminTask[]}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.taskDescription}>
              {item.description}
            </Text>

            <View style={styles.taskFooter}>
              <Text style={styles.assignedText}>
                Assigned to:{' '}
                {(item.assignedTo ?? []).length > 0
                  ? item.assignedTo!
                      .map((u) => u.name)
                      .join(', ')
                  : 'Unassigned'}
              </Text>

              <Text style={styles.taskDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No tasks found
            </Text>
          </View>
        }
      />

      {/* CREATE TASK MODAL */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Task</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input
                label="Task Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Enter title"
              />

              <Input
                label="Task Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                multiline
              />

              <Text style={styles.sectionLabel}>
                Assign Employees
              </Text>

              {employees.map((emp) => (
                <TouchableOpacity
                  key={emp._id}
                  style={styles.employeeItem}
                  onPress={() => toggleEmployee(emp._id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedEmployees.includes(emp._id) &&
                        styles.checkboxChecked,
                    ]}
                  >
                    {selectedEmployees.includes(emp._id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.employeeName}>
                    {emp.name}
                  </Text>
                </TouchableOpacity>
              ))}

              <Button
                title="Create Task"
                onPress={handleCreateTask}
                loading={createTaskMutation.isPending}
                style={styles.createButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.surface },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  backButton: { padding: theme.spacing.sm },

  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },

  addButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
  backgroundColor: theme.colors.white,
  borderRadius:theme.colors.border,
  margin: theme.spacing.lg,
},
filterBar: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.md,

  backgroundColor: theme.colors.white,
  paddingHorizontal: theme.spacing.lg,
  paddingVertical: 6,

  borderRadius: theme.borderRadius.lg,

  // subtle premium depth
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,

  marginHorizontal: theme.spacing.lg,
  marginTop: theme.spacing.md,
},






  listContent: { padding: theme.spacing.lg },

  taskCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  taskTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    flex: 1,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  statusText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },

  taskDescription: {
    marginVertical: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },

  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  assignedText: {
    fontSize: theme.fontSize.xs,
    flex: 1,
  },

  taskDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },

  emptyText: {
    color: theme.colors.textSecondary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },

  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },

  closeButton: { fontSize: 24 },

  modalBody: { padding: theme.spacing.lg },

  sectionLabel: {
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },

  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 5,
    marginRight: 10,
  },

  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  checkmark: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },

  employeeName: {
    fontSize: theme.fontSize.md,
  },

  createButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});
