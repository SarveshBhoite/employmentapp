import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';

type Category = 'leave' | 'wfh' | 'query' | 'complaint';

export default function EmployeeRequests() {
  const router = useRouter();

  const [category, setCategory] = useState<Category>('leave');
  const [message, setMessage] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: myRequests, refetch } =
    trpc.employee.getMyRequests.useQuery();

  const createRequestMutation =
    trpc.employee.createRequest.useMutation({
      onSuccess: () => {
        Alert.alert('Success', 'Request submitted successfully');
        setMessage('');
        setFromDate('');
        setToDate('');
        refetch();
      },
      onError: (error) => {
        Alert.alert('Error', error.message);
      },
    });

  const handleSubmit = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Message is required');
      return;
    }

    if (
      (category === 'leave' || category === 'wfh') &&
      (!fromDate || !toDate)
    ) {
      Alert.alert('Error', 'Please select date range');
      return;
    }

    createRequestMutation.mutate({
      category,
      message,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      case 'replied':
        return theme.colors.primary;
      default:
        return theme.colors.warning;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* CREATE REQUEST */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Create Request</Text>

          {/* CATEGORY */}
          <View style={styles.categoryRow}>
            {(['leave', 'wfh', 'query', 'complaint'] as Category[]).map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.categoryChip,
                    category === item && styles.categoryActive,
                  ]}
                  onPress={() => setCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === item && styles.categoryTextActive,
                    ]}
                  >
                    {item.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {(category === 'leave' || category === 'wfh') && (
            <>
              <Input
                label="From Date (YYYY-MM-DD)"
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="2025-01-10"
              />
              <Input
                label="To Date (YYYY-MM-DD)"
                value={toDate}
                onChangeText={setToDate}
                placeholder="2025-01-12"
              />
            </>
          )}

          <Input
            label="Message"
            value={message}
            onChangeText={setMessage}
            multiline
          />

          <Button
            title="Submit Request"
            onPress={handleSubmit}
            loading={createRequestMutation.isPending}
            style={{ marginTop: theme.spacing.md }}
          />
        </View>

        {/* MY REQUESTS */}
        <Text style={styles.sectionTitle}>Request History</Text>

        {myRequests?.map((req) => (
          <View key={req._id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <Text style={styles.requestCategory}>
                {req.category.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.statusBadge,
                  { color: getStatusColor(req.status) },
                ]}
              >
                {req.status.toUpperCase()}
              </Text>
            </View>

            {req.fromDate && (
              <Text style={styles.metaText}>
                {new Date(req.fromDate).toDateString()} →{' '}
                {new Date(req.toDate!).toDateString()}
              </Text>
            )}

            <Text style={styles.messageText}>{req.message}</Text>

            {req.adminReply && (
              <View style={styles.replyBox}>
                <Text style={styles.replyLabel}>Admin Reply</Text>
                <Text style={styles.replyText}>{req.adminReply}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },
  content: { padding: theme.spacing.lg },
  card: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  categoryTextActive: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  requestCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestCategory: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statusBadge: {
    fontWeight: '700',
    fontSize: theme.fontSize.xs,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  messageText: {
    marginTop: theme.spacing.sm,
  },
  replyBox: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  replyLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    marginBottom: 4,
  },
  replyText: {
    fontSize: theme.fontSize.sm,
  },
});
