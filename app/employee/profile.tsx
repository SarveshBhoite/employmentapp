import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/auth-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState('');

  const { data: profile } = trpc.employee.getProfile.useQuery();

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setPosition(profile.position || '');
    }
  }, [profile]);

  const updateProfileMutation = trpc.employee.updateProfile.useMutation({
    onSuccess: () => {
      if (user) {
        updateUser({ ...user, name, phone, address, position });
      }
      Alert.alert('Success', 'Profile updated successfully!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleUpdate = () => {
    if (!name) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    updateProfileMutation.mutate({ name, phone, address, position });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{profile?.email}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{profile?.role}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Salary</Text>
          <Text style={styles.salaryValue}>₹{profile?.salary || 0}</Text>
          <Text style={styles.readOnlyNote}>Read-only (Contact admin to update)</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Editable Information</Text>

        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Phone"
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Input
          label="Address"
          placeholder="Enter your address"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <Input
          label="Position"
          placeholder="Enter your position"
          value={position}
          onChangeText={setPosition}
        />

        <Button
          title="Update Profile"
          onPress={handleUpdate}
          loading={updateProfileMutation.isPending}
          style={styles.updateButton}
        />
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
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '500',
  },
  salaryValue: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  readOnlyNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  updateButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});
