import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';

export default function AdminRequestsScreen() {
  const router = useRouter();

  const [searchName, setSearchName] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, refetch, isLoading } =
    trpc.admin.getAllRequests.useQuery({ searchName });

  const updateMutation =
    trpc.admin.updateRequestStatus.useMutation({
      onSuccess: () => {
        Alert.alert('Success', 'Request updated');
        setShowModal(false);
        setReply('');
        setSelectedRequest(null);
        refetch();
      },
      onError: (error) => {
        Alert.alert('Error', error.message);
      },
    });

  const handleAction = (status: 'approved' | 'rejected' | 'replied') => {
    if (!reply.trim()) {
      Alert.alert('Reply required', 'Admin reply is mandatory');
      return;
    }

    updateMutation.mutate({
      requestId: selectedRequest._id,
      status,
      adminReply: reply,
    });
  };

  const renderItem = ({ item }: any) => {
    const isLeaveOrWFH =
      item.category === 'leave' || item.category === 'wfh';

    return (
      <View style={styles.card}>
        <Text style={styles.employeeName}>{item.employeeName}</Text>
        <Text style={styles.category}>{item.category.toUpperCase()}</Text>

        <Text style={styles.message}>{item.message}</Text>

        {item.fromDate && item.toDate && (
          <Text style={styles.date}>
            {new Date(item.fromDate).toDateString()} →{' '}
            {new Date(item.toDate).toDateString()}
          </Text>
        )}

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{item.status}</Text>
        </View>

        {item.adminReply && (
          <Text style={styles.reply}>
            Admin: {item.adminReply}
          </Text>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedRequest(item);
            setReply(item.adminReply || '');
            setShowModal(true);
          }}
        >
          <Text style={styles.actionText}>
            {isLeaveOrWFH ? 'Reply / Action' : 'Reply'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search employee by name..."
          value={searchName}
          onChangeText={setSearchName}
          style={styles.searchInput}
        />
      </View>

      {/* LIST */}
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No requests found</Text>
        }
      />

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Admin Reply</Text>

            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Enter reply"
              multiline
              style={styles.textArea}
            />

            <View style={styles.modalActions}>
              {(selectedRequest?.category === 'leave' ||
                selectedRequest?.category === 'wfh') && (
                <>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.approve]}
                    onPress={() => handleAction('approved')}
                  >
                    <Text style={styles.modalBtnText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.reject]}
                    onPress={() => handleAction('rejected')}
                  >
                    <Text style={styles.modalBtnText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.modalBtn, styles.replyOnly]}
                onPress={() => handleAction('replied')}
              >
                <Text style={styles.modalBtnText}>Reply</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.cancel}
            >
              <Text style={{ color: theme.colors.textSecondary }}>
                Cancel
              </Text>
            </TouchableOpacity>
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
  searchInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  listContent: {
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  employeeName: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  category: {
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  message: {
    fontSize: theme.fontSize.sm,
    marginBottom: 6,
  },
  date: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  statusValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  reply: {
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
    color: theme.colors.success,
  },
  actionButton: {
    marginTop: theme.spacing.sm,
  },
  actionText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: theme.spacing.xl,
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
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
  },
  approve: { backgroundColor: theme.colors.success },
  reject: { backgroundColor: theme.colors.error },
  replyOnly: { backgroundColor: theme.colors.primary },
  modalBtnText: { color: '#fff', fontWeight: '600' },
  cancel: { marginTop: theme.spacing.md, alignItems: 'center' },
});
