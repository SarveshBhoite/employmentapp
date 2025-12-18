import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/auth-context';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  /* ================= PROFILE FIELDS ================= */
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState('');

  /* ================= PASSWORD MODAL ================= */
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: profile } = trpc.employee.getProfile.useQuery();

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setPosition(profile.position || '');
    }
  }, [profile]);

  /* ================= UPDATE PROFILE ================= */

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

  const handleUpdateProfile = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    updateProfileMutation.mutate({
      name,
      phone,
      address,
      position,
    });
  };

  /* ================= CHANGE PASSWORD ================= */

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{profile?.email}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{profile?.role}</Text>
        </View>

        <View style={styles.divider} />

        {/* SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Editable Information</Text>
          <TouchableOpacity onPress={() => setShowPasswordModal(true)}>
            <Text style={styles.changePasswordText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        <Input label="Full Name" value={name} onChangeText={setName} />
        <Input label="Phone" value={phone} onChangeText={setPhone} />
        <Input
          label="Address"
          value={address}
          onChangeText={setAddress}
          multiline
          style={styles.textArea}
        />
        <Input label="Position" value={position} onChangeText={setPosition} />

        <Button
          title="Update Profile"
          onPress={handleUpdateProfile}
          loading={updateProfileMutation.isPending}
          style={styles.updateButton}
        />
      </ScrollView>

      {/* CHANGE PASSWORD MODAL */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <Input
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              rightIcon={
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                </TouchableOpacity>
              }
            />

            <Input
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              rightIcon={
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                </TouchableOpacity>
              }
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </TouchableOpacity>
              }
            />

            <Button
              title="Update Password"
              onPress={handleChangePassword}
              loading={changePasswordMutation.isPending}
              style={{ marginTop: theme.spacing.md }}
            />

            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setShowPasswordModal(false)}
              style={{ marginTop: theme.spacing.sm }}
            />
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: { padding: theme.spacing.sm },
  headerTitle: { fontSize: theme.fontSize.lg, fontWeight: '700' },

  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },

  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  infoLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  infoValue: { fontSize: theme.fontSize.md, fontWeight: '500' },

  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: '600' },
  changePasswordText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  textArea: { minHeight: 80, textAlignVertical: 'top' },
  updateButton: { marginTop: theme.spacing.lg },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
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
});
