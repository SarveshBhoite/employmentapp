import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
  TextStyle,
} from 'react-native';
import { theme } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  rightIcon,
  style,
  ...props
}: InputProps) {
  const inputStyles: TextStyle[] = [
    styles.input,
    ...(rightIcon ? [styles.withIcon] : []),
    ...(error ? [styles.inputError] : []),
    ...(style ? [style as TextStyle] : []),
  ];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputWrapper}>
        <TextInput
          {...props}
          placeholderTextColor={theme.colors.textSecondary}
          style={inputStyles}
        />

        {rightIcon && (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },

  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  inputWrapper: {
    position: 'relative',
  },

  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
  },

  withIcon: {
    paddingRight: 44, // ✅ TextStyle safe
  },

  iconContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },

  inputError: {
    borderColor: theme.colors.error,
  },

  errorText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
