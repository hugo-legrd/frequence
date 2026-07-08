import { Pressable, Text, StyleSheet } from 'react-native';

type Props = {
  label: string,
  active: boolean,
  onPress: () => void;
}

export default function GenreChip({ label, active, onPress }: Props) {
  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.text, active && styles.textActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    backgroundColor: '#171717',
  },
  pillActive: {
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
  text: {
    fontSize: 13,
    color: '#555555',
  },
  textActive: {
    color: '#0f0f0f',
    fontWeight: '500',
  },
});