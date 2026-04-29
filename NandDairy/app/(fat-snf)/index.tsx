import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface PendingEntry {
  milk_entry_id: number; shift: string; milk_quantity_liters: string;
  entry_date: string; samiti_name: string; samiti_code: string;
}

export default function FatSnfScreen() {
  const [pending, setPending]       = useState<PendingEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [current, setCurrent]       = useState<PendingEntry | null>(null);
  const [fat, setFat]               = useState('');
  const [snf, setSnf]               = useState('');
  const [rate, setRate]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackMsg, setSnackMsg]     = useState('');
  const [snackError, setSnackError] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fat-snf/pending');
      setPending(res.data);
      if (res.data.length > 0) setCurrent(res.data[0]);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const payout = () => {
    const qty  = parseFloat(current?.milk_quantity_liters || '0');
    const r    = parseFloat(rate);
    return isNaN(qty) || isNaN(r) ? '—' : `₹${(qty * r).toFixed(2)}`;
  };

  const handleSubmit = async () => {
    if (!current) return;
    const fv = parseFloat(fat), sv = parseFloat(snf), rv = parseFloat(rate);
    if (isNaN(fv) || isNaN(sv) || isNaN(rv)) { setSnackError(true); setSnackMsg('Fill all three values'); return; }
    setSubmitting(true);
    try {
      await api.post('/fat-snf', { milk_entry_id: current.milk_entry_id, fat_value: fv, snf_value: sv, rate_per_liter: rv });
      setSnackError(false); setSnackMsg(`✅ ${current.samiti_name} — submitted`);
      setFat(''); setSnf(''); setRate('');
      const next = pending.filter(p => p.milk_entry_id !== current.milk_entry_id);
      setPending(next);
      setCurrent(next[0] || null);
    } catch (e: any) {
      setSnackError(true); setSnackMsg(e.response?.data?.error || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const nextEntry = () => {
    if (!pending.length) return;
    const idx  = pending.findIndex(p => p.milk_entry_id === current?.milk_entry_id);
    const next = pending[(idx + 1) % pending.length];
    setCurrent(next); setFat(''); setSnf(''); setRate('');
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={C.coral} size="large" /></View>;

  if (!current) return (
    <View style={s.center}>
      <Text style={s.doneEmoji}>🎉</Text>
      <Text style={s.doneTitle}>All Entries Tested!</Text>
      <Text style={s.doneSub}>No pending FAT/SNF entries</Text>
      <TouchableOpacity style={s.refreshBtn} onPress={fetchPending}>
        <Text style={s.refreshTxt}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 48 }}>

      {/* ── Progress header ── */}
      <View style={s.progressBar}>
        <View style={s.progressFill} />
      </View>
      <View style={s.countRow}>
        <Text style={s.countTxt}>{pending.length} remaining</Text>
        <TouchableOpacity onPress={nextEntry}>
          <Text style={s.skipTxt}>Skip →</Text>
        </TouchableOpacity>
      </View>

      {/* ── Current entry card ── */}
      <View style={s.entryCard}>
        <View style={s.coralAccent} />
        <View style={s.entryTop}>
          <View>
            <Text style={s.samitiName}>{current.samiti_name}</Text>
            <Text style={s.entryMeta}>
              #{current.samiti_code} · {current.shift === 'morning' ? '🌅 Morning' : '🌙 Evening'} · {new Date(current.entry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
          <View style={s.qtyBadge}>
            <Text style={s.qtyTxt}>{parseFloat(current.milk_quantity_liters).toFixed(1)}</Text>
            <Text style={s.qtyUnit}>L</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* FAT input */}
        <Text style={s.fieldLabel}>FAT VALUE</Text>
        <TextInput style={s.fieldInput} value={fat} onChangeText={setFat} keyboardType="decimal-pad" placeholder="0.0 – 10.0" placeholderTextColor={C.textTer} />
        <View style={s.presetRow}>
          {['3.5', '4.0', '4.5', '5.0'].map(v => (
            <TouchableOpacity key={v} style={s.preset} onPress={() => setFat(v)}>
              <Text style={s.presetTxt}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SNF input */}
        <Text style={[s.fieldLabel, { marginTop: 12 }]}>SNF VALUE</Text>
        <TextInput style={s.fieldInput} value={snf} onChangeText={setSnf} keyboardType="decimal-pad" placeholder="0.0 – 15.0" placeholderTextColor={C.textTer} />
        <View style={s.presetRow}>
          {['8.0', '8.5', '9.0', '9.5'].map(v => (
            <TouchableOpacity key={v} style={s.preset} onPress={() => setSnf(v)}>
              <Text style={s.presetTxt}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rate input */}
        <Text style={[s.fieldLabel, { marginTop: 12 }]}>RATE / LITER (₹)</Text>
        <TextInput style={s.fieldInput} value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder="e.g. 32.00" placeholderTextColor={C.textTer} />
        <View style={s.presetRow}>
          {['28', '30', '32', '35'].map(v => (
            <TouchableOpacity key={v} style={s.preset} onPress={() => setRate(v)}>
              <Text style={s.presetTxt}>₹{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payout preview */}
        <View style={s.payoutCard}>
          <Text style={s.payoutLabel}>ESTIMATED PAYOUT</Text>
          <Text style={s.payoutValue}>{payout()}</Text>
        </View>

        <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitTxt}>Submit & Next →</Text>}
        </TouchableOpacity>
      </View>

      {/* ── Queue list ── */}
      {pending.length > 1 && (
        <>
          <Text style={s.queueLabel}>QUEUE ({pending.length - 1} more)</Text>
          {pending.filter(p => p.milk_entry_id !== current.milk_entry_id).slice(0, 4).map(p => (
            <TouchableOpacity key={p.milk_entry_id} style={s.queueItem} onPress={() => { setCurrent(p); setFat(''); setSnf(''); setRate(''); }}>
              <Text style={s.queueName}>{p.samiti_name}</Text>
              <Text style={s.queueMeta}>{parseFloat(p.milk_quantity_liters).toFixed(1)}L · {p.shift}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <Snackbar visible={!!snackMsg} onDismiss={() => setSnackMsg('')} duration={3500}
        style={{ backgroundColor: snackError ? C.errorBg : C.successBg, margin: 16, borderRadius: 12 }}>
        <Text style={{ color: snackError ? C.error : C.success, fontWeight: '500' }}>{snackMsg}</Text>
      </Snackbar>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  center:       { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 32 },

  // Progress
  progressBar:  { height: 4, backgroundColor: C.border, marginHorizontal: 16, marginTop: 16, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: C.coral, width: '40%', borderRadius: 2 },
  countRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  countTxt:     { fontSize: 13, color: C.textSec, fontWeight: '500' },
  skipTxt:      { fontSize: 13, color: C.coral, fontWeight: '700' },

  // Entry card
  entryCard:    { marginHorizontal: 16, backgroundColor: C.white, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 14, elevation: 3, overflow: 'hidden' },
  coralAccent:  { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: C.coral },
  entryTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 },
  samitiName:   { fontSize: 20, fontWeight: '800', color: C.textPri },
  entryMeta:    { fontSize: 12, color: C.textSec, marginTop: 4 },
  qtyBadge:     { backgroundColor: '#FBE9E7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  qtyTxt:       { fontSize: 22, fontWeight: '800', color: C.coral },
  qtyUnit:      { fontSize: 11, color: C.coral, fontWeight: '600' },
  divider:      { height: 1, backgroundColor: C.border, marginVertical: 16 },

  // Fields
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: C.textSec, letterSpacing: 1, marginBottom: 6 },
  fieldInput:   { height: 52, backgroundColor: C.inputFill, borderRadius: 12, paddingHorizontal: 16, color: C.textPri, fontSize: 18, fontWeight: '700' },
  presetRow:    { flexDirection: 'row', gap: 8, marginTop: 8 },
  preset:       { flex: 1, backgroundColor: '#FBE9E7', borderRadius: 100, paddingVertical: 7, alignItems: 'center' },
  presetTxt:    { color: C.coral, fontSize: 12, fontWeight: '700' },

  // Payout
  payoutCard:   { backgroundColor: C.surfaceLow, borderRadius: 14, padding: 16, marginTop: 16, marginBottom: 16, alignItems: 'center' },
  payoutLabel:  { fontSize: 10, fontWeight: '700', color: C.textSec, letterSpacing: 1 },
  payoutValue:  { fontSize: 28, fontWeight: '800', color: C.coral, marginTop: 4 },

  // Submit
  submitBtn:    { height: 56, backgroundColor: C.coral, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: C.coral, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6 },
  submitTxt:    { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Queue
  queueLabel:   { fontSize: 10, fontWeight: '700', color: C.textSec, letterSpacing: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  queueItem:    { backgroundColor: C.white, marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  queueName:    { fontSize: 14, fontWeight: '600', color: C.textPri },
  queueMeta:    { fontSize: 12, color: C.textSec },

  // Done state
  doneEmoji:    { fontSize: 56, marginBottom: 16 },
  doneTitle:    { fontSize: 22, fontWeight: '800', color: C.textPri, marginBottom: 8 },
  doneSub:      { fontSize: 14, color: C.textSec, marginBottom: 24 },
  refreshBtn:   { backgroundColor: C.coral, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  refreshTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});
