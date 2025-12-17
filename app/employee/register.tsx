import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/auth-context';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState('');

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      await login(data.token, data.user);
      router.replace('/employee/dashboard' as any);
    },
    onError: (error) => {
      Alert.alert('Registration Failed', error.message);
    },
  });

  const handleRegister = () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    registerMutation.mutate({ name, email, password, phone, address, position });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our team today</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name *"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />
            <Input
              label="Email *"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Password *"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
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
            />
            <Input
              label="Position"
              placeholder="Enter your position"
              value={position}
              onChangeText={setPosition}
            />

            <Button
              title="Register"
              onPress={handleRegister}
              loading={registerMutation.isPending}
              style={styles.registerButton}
            />

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  form: {
    marginTop: theme.spacing.md,
  },
  registerButton: {
    marginTop: theme.spacing.md,
  },
  loginText: {
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
});
