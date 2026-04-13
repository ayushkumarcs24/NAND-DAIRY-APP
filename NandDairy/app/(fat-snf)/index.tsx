import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import api from '../../services/api';
import { C } from '../../constants/Theme';

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
      setPending(res.data); setCurrentIndex(0);
    } catch { setSnackError(true); setSnackMsg('Failed to load pending entries'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const current = pending[currentIndex];
  const quantity = current ? parseFloat(current.milk_quantity_liters) : 0;
  const rateVal = parseFloat(rate) || 0;
  const liveAmount = (quantity * rateVal).toFixed(2);
  const progress = pending.length > 0 ? (currentIndex + 1) / pending.length : 0;

  const slideToNext = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -400, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 400, duration: 0, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!fat || !snf || !rate) { setSnackError(true); setSnackMsg('All fields required'); return; }
    const fatVal = parseFloat(fat); const snfVal = parseFloat(snf);
    if (fatVal < 0 || fatVal > 10) { setSnackError(true); setSnackMsg('FAT must be 0–10'); return; }
    if (snfVal < 0 || snfVal > 15) { setSnackError(true); setSnackMsg('SNF must be 0–15'); return; }
    setSubmitting(true);
    try {
      await api.post('/fat-snf', { milk_entry_id: current.milk_entry_id, fat_value: fatVal, snf_value: snfVal, rate_per_liter: rateVal });
      setSnackError(false); setSnackMsg(`✅ Saved — ${current.samiti_name}`);
      slideToNext(); setFat(''); setSnf(''); setRate('');
      if (currentIndex < pending.length - 1) { setCurrentIndex(i => i + 1); }
      else { await fetchPending(); }
    } catch (e: any) {
      setSnackError(true); setSnackMsg(e.response?.data?.error || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>;

  if (pending.length === 0) return (
    <View style={s.center}>
      <Text style={{ fontSize: 64 }}>🎉</Text>
      <Text style={s.doneTitle}>All Done!</Text>
      <Text style={s.doneSub}>No pending FAT/SNF entries.</Text>
      <TouchableOpacity style={[s.primaryBtn, { marginTop: 24, paddingHorizontal: 32 }]} onPress={fetchPending}>
        <Text style={s.primaryBtnText}>↻  Check Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.screen}>
      {/* Progress */}
      <View style={s.progressSection}>
        <Text style={s.progressLabel}>{currentIndex + 1} of {pending.length} pending</Text>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Entry Card */}
      <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
        <View style={s.entryCard}>
          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.samitiName}>{current.samiti_name}</Text>
              <Text style={s.entryDate}>{new Date(current.entry_date).toLocaleDateString('en-IN')}</Text>
            </View>
            <View style={s.codeBadge}><Text style={s.codeText}>{current.samiti_code}</Text></View>
          </View>
          <View style={s.badgeRow}>
            <View style={[s.shiftBadge, { backgroundColor: current.shift === 'morning' ? C.morning : C.evening }]}>
              <Text style={s.badgeText}>{current.shift === 'morning' ? '🌅 Morning' : '🌆 Evening'}</Text>
            </View>
            <View style={s.milkBadge}>
              <Text style={s.milkBadgeText}>🥛 {parseFloat(current.milk_quantity_liters).toFixed(1)} L</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Inputs */}
      <View style={s.inputs}>
        <View style={s.inputRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.inputLabel}>FAT %</Text>
            <View style={s.inputWrap}>
              <TextInput style={s.input} value={fat} onChangeText={setFat} keyboardType="decimal-pad" placeholder="0.0" placeholderTextColor={C.textTer} />
              <Text style={s.suffix}>%</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.inputLabel}>SNF %</Text>
            <View style={s.inputWrap}>
              <TextInput style={s.input} value={snf} onChangeText={setSnf} keyboardType="decimal-pad" placeholder="0.0" placeholderTextColor={C.textTer} />
              <Text style={s.suffix}>%</Text>
            </View>
          </View>
        </View>

        <Text style={s.inputLabel}>Rate per Liter (₹)</Text>
        <View style={s.inputWrap}>
          <Text style={s.prefix}>₹</Text>
          <TextInput style={[s.input, { flex: 1 }]} value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.textTer} />
        </View>

        {rateVal > 0 && (
          <View style={s.amountCard}>
            <Text style={s.amountLabel}>Estimated Amount</Text>
            <Text style={s.amountValue}>₹{liveAmount}</Text>
          </View>
        )}

        <TouchableOpacity style={[s.primaryBtn, { marginTop: 12 }, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>Submit & Next  →</Text>}
        </TouchableOpacity>
      </View>

      <Snackbar
        visible={!!snackMsg} onDismiss={() => setSnackMsg('')} duration={3000}
        style={{ backgroundColor: snackError ? '#3a1212' : '#0d2a0d', margin: 16, borderRadius: 12 }}
      >
        <Text style={{ color: snackError ? C.error : C.success }}>{snackMsg}</Text>
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: C.bg, padding: 16 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, padding: 24 },
  doneTitle:      { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 12, letterSpacing: -0.3 },
  doneSub:        { color: C.textSec, fontSize: 15, marginTop: 8, textAlign: 'center' },
  progressSection:{ marginBottom: 16 },
  progressLabel:  { color: C.textSec, fontSize: 12, marginBottom: 8 },
  progressTrack:  { height: 8, backgroundColor: C.surfaceVar, borderRadius: 4, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: C.primary, borderRadius: 4 },
  entryCard:      { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 20 },
  cardHeader:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  samitiName:     { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  entryDate:      { color: C.textSec, fontSize: 12, marginTop: 4 },
  codeBadge:      { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  codeText:       { color: '#fff', fontWeight: '700', fontSize: 20, letterSpacing: 2 },
  badgeRow:       { flexDirection: 'row', gap: 8 },
  shiftBadge:     { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  milkBadge:      { backgroundColor: '#1c2e1c', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText:      { color: '#fff', fontSize: 12, fontWeight: '600' },
  milkBadgeText:  { color: C.success, fontSize: 12, fontWeight: '600' },
  inputs:         {},
  inputRow:       { flexDirection: 'row', gap: 12, marginBottom: 14 },
  inputLabel:     { color: C.textSec, fontSize: 12, marginBottom: 6 },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceVar, borderRadius: 10, paddingHorizontal: 12, height: 46, marginBottom: 2 },
  input:          { color: '#fff', fontSize: 15, flex: 1 },
  suffix:         { color: C.textSec, fontSize: 15, marginLeft: 4 },
  prefix:         { color: C.textSec, fontSize: 15, marginRight: 4 },
  amountCard:     { backgroundColor: '#0d1f0d', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  amountLabel:    { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  amountValue:    { color: C.success, fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  primaryBtn:     { backgroundColor: C.primary, borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
});
