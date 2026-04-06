import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import {
  Text, TextInput, Button, Card, Chip,
  Snackbar, ActivityIndicator, ProgressBar,
} from 'react-native-paper';
import api from '../../services/api';
import { DairyTheme } from '../../constants/Theme';

interface PendingEntry {
  milk_entry_id: number; samiti_name: string; samiti_code: string;
  shift: string; milk_quantity_liters: string; entry_date: string;
}

export default function FatSnfScreen() {
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fat, setFat] = useState('');
  const [snf, setSnf] = useState('');
  const [rate, setRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackError, setSnackError] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const fetchPending = useCallback(async () => {
    try {
      const res = await api.get('/fat-snf/pending');
      setPending(res.data);
      setCurrentIndex(0);
    } catch { setSnackError(true); setSnackMsg('Failed to load pending entries'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const current = pending[currentIndex];
  const quantity = current ? parseFloat(current.milk_quantity_liters) : 0;
  const fatVal = parseFloat(fat) || 0;
  const snfVal = parseFloat(snf) || 0;
  const rateVal = parseFloat(rate) || 0;
  const liveAmount = (quantity * rateVal).toFixed(2);

  const slideToNext = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -400, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 400, duration: 0, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!fat || !snf || !rate) { setSnackError(true); setSnackMsg('All fields are required'); return; }
    if (fatVal < 0 || fatVal > 10) { setSnackError(true); setSnackMsg('Fat must be 0–10'); return; }
    if (snfVal < 0 || snfVal > 15) { setSnackError(true); setSnackMsg('SNF must be 0–15'); return; }

    setSubmitting(true);
    try {
      await api.post('/fat-snf', {
        milk_entry_id: current.milk_entry_id,
        fat_value: fatVal, snf_value: snfVal, rate_per_liter: rateVal,
      });
      setSnackError(false);
      setSnackMsg(`✅ Saved — ${current.samiti_name}`);
      slideToNext();
      setFat(''); setSnf(''); setRate('');

      if (currentIndex < pending.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        // Refresh to confirm no more pending
        await fetchPending();
      }
    } catch (e: any) {
      setSnackError(true);
      setSnackMsg(e.response?.data?.error || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={DairyTheme.colors.primary} /></View>
  );

  if (pending.length === 0) return (
    <View style={styles.center}>
      <Text style={{ fontSize: 64 }}>🎉</Text>
      <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginTop: 12 }}>All Done!</Text>
      <Text variant="bodyMedium" style={{ color: '#888', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
        All entries completed. No pending FAT/SNF data.
      </Text>
      <Button mode="outlined" onPress={fetchPending} style={{ marginTop: 24 }} icon="refresh">
        Check Again
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <Text variant="labelMedium" style={{ color: '#555', marginBottom: 6 }}>
          {currentIndex + 1} of {pending.length} pending
        </Text>
        <ProgressBar
          progress={(currentIndex + 1) / pending.length}
          color={DairyTheme.colors.primary}
          style={styles.progressBar}
        />
      </View>

      {/* Current Entry Card */}
      <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
        <Card style={styles.entryCard} elevation={4}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>{current.samiti_name}</Text>
                <Text variant="bodySmall" style={{ color: '#888' }}>
                  {new Date(current.entry_date).toLocaleDateString('en-IN')}
                </Text>
              </View>
              <Chip
                style={{ backgroundColor: DairyTheme.colors.primary }}
                textStyle={{ color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 3 }}
              >
                {current.samiti_code}
              </Chip>
            </View>

            <View style={styles.badges}>
              <Chip
                compact
                style={{ backgroundColor: current.shift === 'morning' ? '#FFA726' : '#5C6BC0' }}
                textStyle={{ color: '#fff' }}
              >
                {current.shift === 'morning' ? '🌅 Morning' : '🌆 Evening'}
              </Chip>
              <Chip compact style={{ backgroundColor: '#E8F5E9' }} textStyle={{ color: '#388E3C' }}>
                🥛 {parseFloat(current.milk_quantity_liters).toFixed(1)} L
              </Chip>
            </View>
          </Card.Content>
        </Card>
      </Animated.View>

      {/* Input Fields */}
      <View style={styles.inputs}>
        <View style={styles.inputRow}>
          <TextInput
            label="FAT %"
            mode="outlined"
            value={fat}
            onChangeText={setFat}
            keyboardType="decimal-pad"
            style={[styles.halfInput, { backgroundColor: '#fff' }]}
            right={<TextInput.Affix text="%" />}
          />
          <TextInput
            label="SNF %"
            mode="outlined"
            value={snf}
            onChangeText={setSnf}
            keyboardType="decimal-pad"
            style={[styles.halfInput, { backgroundColor: '#fff' }]}
            right={<TextInput.Affix text="%" />}
          />
        </View>
        <TextInput
          label="Rate per Liter (₹)"
          mode="outlined"
          value={rate}
          onChangeText={setRate}
          keyboardType="decimal-pad"
          style={{ backgroundColor: '#fff', marginBottom: 12 }}
          left={<TextInput.Affix text="₹" />}
        />

        {/* Live Amount Preview */}
        {rateVal > 0 && (
          <Card style={styles.amountCard}>
            <Card.Content style={styles.amountRow}>
              <Text variant="titleMedium" style={{ color: '#555' }}>Estimated Amount</Text>
              <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#2E7D32' }}>
                ₹{liveAmount}
              </Text>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          icon="arrow-right-circle"
          style={{ marginTop: 12, paddingVertical: 4 }}
        >
          Submit & Next
        </Button>
      </View>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={3000}
        style={{ backgroundColor: snackError ? '#B71C1C' : '#1B5E20' }}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FC', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  progressSection: { marginBottom: 16 },
  progressBar: { height: 8, borderRadius: 4 },
  entryCard: { borderRadius: 16, backgroundColor: '#fff', marginBottom: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8 },
  inputs: {},
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  halfInput: { flex: 1 },
  amountCard: { borderRadius: 12, backgroundColor: '#E8F5E9', marginBottom: 4 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
