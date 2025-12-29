// components/LightDropdown.tsx
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { theme } from '@/constants/theme';

type Option = {
  label: string;
  value: string;
};

interface Props {
    label?:string;
  value?: string;
  placeholder?: string;
  options: Option[];
  onChange: (value: string) => void;
}

export function LightDropdown({
  value,
  placeholder = 'Select',
  options,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    options.find(o => o.value === value)?.label || placeholder;

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.value,
            !value && { color: theme.colors.textSecondary },
          ]}
        >
          {selectedLabel}
        </Text>
        <ChevronDown size={18} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(i) => i.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },

  value: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },

  sheet: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    maxHeight: '60%',
  },

  option: {
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  optionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
});
