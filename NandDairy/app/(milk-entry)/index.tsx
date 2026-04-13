import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface SamitiResult { samiti_id: number; samiti_name: string; code_4digit: string; }
interface MilkEntry { id: number; samiti_name: string; code_4digit: string; shift: string; milk_quantity_liters: string; created_at: string; }

const today = new Date().toISOString().split('T')[0];
const todayDisplay = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function MilkEntryScreen() {
  const [shift, setShift] = useState<'morning' | 'evening'>('morning');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [samiti, setSamiti] = useState<SamitiResult | null>(null);
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackError, setSnackError] = useState(false);

  const fetchEntries = useCallback(async (s?: string) => {
    try {
      const res = await api.get(`/milk-entries/today?shift=${s || shift}`);
      setEntries(res.data);
    } catch { } finally { setLoadingEntries(false); setRefreshing(false); }
  }, [shift]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSearch = async () => {
    if (!vehicleNumber.trim()) { setSnackError(true); setSnackMsg('Enter a vehicle number'); return; }
    setSearching(true); setSamiti(null);
    try {
      const res = await api.get(`/vehicles/search/${vehicleNumber.trim().toUpperCase()}`);
      setSamiti(res.data);
    } catch {
      setSnackError(true); setSnackMsg('Vehicle not found.');
    } finally { setSearching(false); }
  };

  const handleSubmit = async () => {
    if (!samiti || !quantity) { setSnackError(true); setSnackMsg('Search vehicle and enter quantity'); return; }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) { setSnackError(true); setSnackMsg('Enter a valid quantity'); return; }
    setSubmitting(true);
    try {
      await api.post('/milk-entries', { samiti_id: samiti.samiti_id, shift, entry_date: today, milk_quantity_liters: qty });
      setSnackError(false); setSnackMsg(`✅ Saved — ${samiti.samiti_name}, ${qty}L`);
      setSamiti(null); setVehicleNumber(''); setQuantity('');
      fetchEntries();
    } catch (e: any) {
      setSnackError(true); setSnackMsg(e.response?.data?.error || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }
    catch { return ''; }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Shift Toggle */}
      <View style={s.shiftRow}>
        <Text style={s.dateLabel}>📅 {todayDisplay}</Text>
        <View style={s.segmented}>
          {(['morning', 'evening'] as const).map(sh => (
            <TouchableOpacity
              key={sh}
              style={[s.segTab, shift === sh && s.segTabActive]}
              onPress={() => { setShift(sh); fetchEntries(sh); }}
            >
              <Text style={[s.segText, shift === sh && s.segTextActive]}>
                {sh === 'morning' ? '🌅 Morning' : '🌆 Evening'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search */}
      <View style={s.searchCard}>
        <View style={s.searchRow}>
          <TextInput
            style={s.searchInput}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            placeholder="Vehicle Number (e.g. MH04AB1234)"
            placeholderTextColor={C.textTer}
            autoCapitalize="characters"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={[s.searchBtn, searching && { opacity: 0.7 }]} onPress={handleSearch} disabled={searching}>
            {searching ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.searchBtnText}>Search</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Samiti Result */}
      {samiti && (
        <View style={s.samitiCard}>
          <View style={s.samitiTop}>
            <View>
              <Text style={s.samitiName}>{samiti.samiti_name}</Text>
              <Text style={s.samitiFound}>✓ Samiti found</Text>
            </View>
            <View style={s.codeBadge}><Text style={s.codeText}>{samiti.code_4digit}</Text></View>
          </View>
          <View style={s.tonalLine} />
          <Text style={s.inputLabel}>Milk Quantity (Liters)</Text>
          <View style={s.qtyRow}>
            <TextInput
              style={[s.searchInput, { flex: 1 }]}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={C.textTer}
            />
            <View style={s.unitBadge}><Text style={s.unitText}>L</Text></View>
          </View>
          <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitBtnText}>✓  Submit Entry</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Today's Entries */}
      <View style={s.entriesHeader}>
        <Text style={s.entriesTitle}>Today's Entries</Text>
        <View style={s.countBadge}><Text style={s.countText}>{entries.length}</Text></View>
      </View>

      {loadingEntries
        ? <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />
        : (
          <FlatList
            data={entries}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEntries(); }} tintColor={C.primary} />}
            renderItem={({ item }) => (
              <View style={s.entryCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.entryName}>{item.samiti_name}</Text>
                  <Text style={s.entryTime}>{formatTime(item.created_at)}</Text>
                </View>
                <View style={s.entryCodeChip}><Text style={s.entryCode}>{item.code_4digit}</Text></View>
                <Text style={s.entryQty}>{parseFloat(item.milk_quantity_liters).toFixed(1)}L</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={s.empty}>No entries for this shift yet.</Text>}
          />
        )
      }

      <Snackbar
        visible={!!snackMsg} onDismiss={() => setSnackMsg('')} duration={3500}
        style={{ backgroundColor: snackError ? '#3a1212' : '#0d2a0d', margin: 16, borderRadius: 12 }}
      >
        <Text style={{ color: snackError ? C.error : C.success }}>{snackMsg}</Text>
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  shiftRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, backgroundColor: C.bg },
  dateLabel:     { color: C.textSec, fontSize: 13 },
  segmented:     { flex: 1, flexDirection: 'row', backgroundColor: C.surfaceVar, borderRadius: 10, padding: 3, gap: 3 },
  segTab:        { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  segTabActive:  { backgroundColor: C.primary },
  segText:       { color: C.textSec, fontSize: 13, fontWeight: '500' },
  segTextActive: { color: '#fff' },
  searchCard:    { marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  searchRow:     { flexDirection: 'row', gap: 10 },
  searchInput:   { flex: 1, backgroundColor: C.surfaceVar, borderRadius: 10, color: '#fff', paddingHorizontal: 14, height: 44, fontSize: 14 },
  searchBtn:     { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  samitiCard:    { marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  samitiTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  samitiName:    { color: '#fff', fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  samitiFound:   { color: C.success, fontSize: 12, marginTop: 3 },
  codeBadge:     { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  codeText:      { color: '#fff', fontWeight: '700', fontSize: 20, letterSpacing: 2 },
  tonalLine:     { height: 1, backgroundColor: C.surfaceVar, marginBottom: 14 },
  inputLabel:    { color: C.textSec, fontSize: 12, marginBottom: 6 },
  qtyRow:        { flexDirection: 'row', gap: 8, marginBottom: 14 },
  unitBadge:     { backgroundColor: C.surfaceVar, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  unitText:      { color: C.textSec, fontSize: 15, fontWeight: '600' },
  submitBtn:     { backgroundColor: C.primary, borderRadius: 10, height: 46, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  entriesHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  entriesTitle:  { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  countBadge:    { backgroundColor: C.surfaceVar, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText:     { color: '#fff', fontSize: 12, fontWeight: '600' },
  entryCard:     { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  entryName:     { color: '#fff', fontSize: 14, fontWeight: '600' },
  entryTime:     { color: C.textSec, fontSize: 12, marginTop: 2 },
  entryCodeChip: { backgroundColor: '#1c2a3a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginHorizontal: 10 },
  entryCode:     { color: '#7AB8F5', fontSize: 13, fontWeight: '700' },
  entryQty:      { color: C.primary, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  empty:         { textAlign: 'center', color: C.textSec, marginTop: 40, fontSize: 14 },
});
