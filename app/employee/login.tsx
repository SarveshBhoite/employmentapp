import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await login(data.token, data.user);
      router.replace(
        data.user.role === 'admin'
          ? '/admin/dashboard'
          : '/employee/dashboard'
      );
    },
    onError: (error) => {
      Alert.alert('Login Failed', error.message);
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>

          {/* LOGO */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/jisnulogo.jpeg')}
              style={styles.logo}
            />
            <Text style={styles.companyName}>
              Jisnu Digitals Solutions Pvt. Ltd
            </Text>
          </View>

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.colors.textSecondary} />
                  )}
                </TouchableOpacity>
              }
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loginMutation.isPending}
              style={styles.loginButton}
            />

            <TouchableOpacity onPress={() => router.push('/employee/register')}>
              <Text style={styles.registerText}>
                Don&apos;t have an account?{' '}
                <Text style={styles.registerLink}>Register</Text>
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
    justifyContent: 'flex-start',
    paddingTop: 90,
  },
  container: {
    padding: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 90,
    height: 97,
    borderRadius: 12,
    marginBottom: 8,
  },
  companyName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  header: {
    marginBottom: theme.spacing.sm,
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
  loginButton: {
    marginTop: theme.spacing.md,
  },
  registerText: {
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  registerLink: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
});
