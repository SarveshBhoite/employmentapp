import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { theme } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { LightDropdown } from "@/components/LightDropdown";

export default function SubmitReportScreen() {
  const router = useRouter();

  const [taskId, setTaskId] = useState<string>("");
  const [taskTitle, setTaskTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"ongoing" | "in_progress" | "completed">(
    "completed"
  );

  const { data: tasks = [] } = trpc.employee.getMyTasks.useQuery();

  const submitReportMutation = trpc.employee.submitReport.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Report submitted successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSubmit = () => {
    if (!taskId) {
      Alert.alert("Error", "Please select a task or choose Other");
      return;
    }

    if (!summary.trim()) {
      Alert.alert("Error", "Please enter report summary");
      return;
    }

    if (taskId === "other" && !taskTitle.trim()) {
      Alert.alert("Error", "Please enter report title");
      return;
    }

    const payload: any = { summary, status };

    if (taskId === "other") {
      payload.taskTitle = taskTitle;
    } else {
      payload.taskId = taskId;
    }

    submitReportMutation.mutate(payload);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* TASK SELECTOR */}
        <Text style={styles.label}>Select Task</Text>
        <View style={styles.pickerContainer}>
          <LightDropdown
            label="Select Task"
            value={taskId}
            placeholder="Select task..."
            onChange={(value) => {
              setTaskId(value);

              if (!value || value === "other") {
                setTaskTitle("");
                return;
              }

              const selectedTask = tasks.find((t) => t._id === value);
              if (selectedTask) {
                setTaskTitle(selectedTask.title);
              }
            }}
            options={[
              ...tasks.map((task) => ({
                label: task.title,
                value: task._id,
              })),
              { label: "Other (General Report)", value: "other" },
            ]}
          />
        </View>

        {/* READ-ONLY TITLE */}
        {taskId && taskId !== "other" && (
          <Input label="Task Title" value={taskTitle} editable={false} />
        )}

        {/* CUSTOM TITLE */}
        {taskId === "other" && (
          <Input
            label="Report Title"
            placeholder="Enter report title"
            value={taskTitle}
            onChangeText={setTaskTitle}
          />
        )}

        {/* STATUS SELECTOR */}
        <Text style={styles.label}>Status</Text>
        <View style={styles.pickerContainer}>
          <LightDropdown
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as any)}
            options={[
              { label: "Completed", value: "completed" },
              { label: "In Progress", value: "in_progress" },
              { label: "Ongoing", value: "ongoing" },
            ]}
          />
        </View>

        {/* SUMMARY */}
        <Input
          label="Report Summary"
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

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontWeight: "700",
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,

    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 2,

    borderRadius: theme.borderRadius.lg,

    // subtle premium depth
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});
