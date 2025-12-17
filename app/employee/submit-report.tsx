import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';

export default function SubmitReportScreen() {
  const router = useRouter();
  const [taskId, setTaskId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState('completed');

  const { data: tasks } = trpc.employee.getMyTasks.useQuery();

  const submitReportMutation = trpc.employee.submitReport.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Report submitted successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSubmit = () => {
    if (!taskId || !taskTitle || !summary) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    submitReportMutation.mutate({ taskId, taskTitle, summary, status });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label="Task Title"
          placeholder="Enter task title"
          value={taskTitle}
          onChangeText={setTaskTitle}
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Select Task</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={taskId}
              onValueChange={(value) => {
                setTaskId(value);
                const selectedTask = tasks?.find(t => t._id === value);
                if (selectedTask) {
                  setTaskTitle(selectedTask.title);
                }
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select a task..." value="" />
              {tasks?.map((task) => (
                <Picker.Item key={task._id} label={task.title} value={task._id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={status}
              onValueChange={setStatus}
              style={styles.picker}
            >
              <Picker.Item label="Completed" value="completed" />
              <Picker.Item label="In Progress" value="in_progress" />
              <Picker.Item label="Ongoing" value="ongoing" />
            </Picker>
          </View>
        </View>

        <Input
          label="Task Summary"
          placeholder="Describe what you've done..."
          value={summary}
          onChangeText={setSummary}
          multiline
          numberOfLines={6}
          style={styles.textArea}
        />

        <Button
          title="Submit Report"
          onPress={handleSubmit}
          loading={submitReportMutation.isPending}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  pickerContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
  },
  picker: {
    height: 52,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});
