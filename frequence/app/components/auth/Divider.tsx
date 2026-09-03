import { View, Text } from 'react-native';
import { makeStyles } from '../../../lib/theme/makeStyles';

export function Divider({ label = 'ou' }: { label?: string }) {
  const s = useStyles();
  return (
    <View style={s.row}>
      <View style={s.line} />
      <Text style={s.text}>{label}</Text>
      <View style={s.line} />
    </View>
  )
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 },
  line: { flex: 1, height: 1, backgroundColor: c.divider },
  text: { fontSize: 11, color: c.textMuted },
}));