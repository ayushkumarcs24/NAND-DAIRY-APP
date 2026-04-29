import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface SamitiResult { samiti_id: number; samiti_name: string; code_4digit: string; }
interface MilkEntry   { id: number; samiti_name: string; shift: string; milk_quantity_liters: string; created_at: string; }

const today        = new Date().toISOString().split('T')[0];
const todayDisplay = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function MilkEntryScreen() {
  const { user, signOut } = useAuth();
  const [shift, setShift]                   = useState<'morning' | 'evening'>('morning');
  const [vehicleNumber, setVehicleNumber]   = useState('');
  const [searching, setSearching]           = useState(false);
  const [samitiList, setSamitiList]         = useState<SamitiResult[]>([]);
  const [samiti, setSamiti]                 = useState<SamitiResult | null>(null);
  const [quantity, setQuantity]             = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [entries, setEntries]               = useState<MilkEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [snackMsg, setSnackMsg]             = useState('');
  const [snackError, setSnackError]         = useState(false);

  const fetchEntries = useCallback(async (s?: string) => {
    try {
      const res = await api.get(`/milk-entries/today?shift=${s || shift}`);
      setEntries(res.data);
    } catch { } finally { setLoadingEntries(false); setRefreshing(false); }
  }, [shift]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSearch = async () => {
    if (!vehicleNumber.trim()) { setSnackError(true); setSnackMsg('Enter a vehicle number'); return; }
    setSearching(true); setSamiti(null); setSamitiList([]);
    try {
      const res = await api.get(`/vehicles/search/${vehicleNumber.trim().toUpperCase()}`);
      const list: SamitiResult[] = res.data;
      setSamitiList(list);
      if (list.length >= 1) setSamiti(list[0]);
      else { setSnackError(true); setSnackMsg('No samitis found for this vehicle.'); }
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
      setSnackError(false); setSnackMsg(`✅ ${samiti.samiti_name} — ${qty}L saved`);
      setSamiti(null); setVehicleNumber(''); setQuantity(''); setSamitiList([]);
      fetchEntries();
    } catch (e: any) {
      setSnackError(true); setSnackMsg(e.response?.data?.error || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }
    catch { return ''; }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Top bar ── */}
      <View style={[s.topBar, { paddingTop: Platform.OS === 'ios' ? 50 : 40 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.topDate}>{todayDisplay} • Hello, {user?.name?.split(' ')[0]}</Text>
          <Text style={s.topTitle}>Milk Collection</Text>
        </View>
        <View style={s.segWrap}>
          {(['morning', 'evening'] as const).map(sh => (
            <TouchableOpacity
              key={sh}
              style={[s.seg, shift === sh && s.segActive]}
              onPress={() => { setShift(sh); fetchEntries(sh); }}
            >
              <Text style={[s.segTxt, shift === sh && s.segTxtActive]}>
                {sh === 'morning' ? '🌅 Morning' : '🌙 Evening'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={signOut} style={s.logoutBtn}>
          <MaterialCommunityIcons name="logout" size={20} color={C.error} />
        </TouchableOpacity>
      </View>

      {/* ── Vehicle search card ── */}
      <View style={s.card}>
        <Text style={s.cardLabel}>VEHICLE NUMBER</Text>
        <View style={s.row}>
          <TextInput
            style={s.input}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            placeholder="e.g. MH09AB1234"
            placeholderTextColor={C.textTer}
            autoCapitalize="characters"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={[s.searchBtn, searching && { opacity: 0.6 }]} onPress={handleSearch} disabled={searching}>
            {searching ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.searchBtnTxt}>Search</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Samiti result card ── */}
      {samitiList.length > 0 && samiti && (
        <View style={s.card}>
          <View style={s.tealAccent} />
          <View style={s.row} >
            <View style={{ flex: 1 }}>
              <Text style={s.samitiName}>{samiti.samiti_name}</Text>
              <Text style={s.samitiFound}>✓ Samiti found</Text>
            </View>
            <View style={s.codeBadge}><Text style={s.codeText}>{samiti.code_4digit}</Text></View>
          </View>

          {samitiList.length > 1 && (
            <>
              <Text style={[s.cardLabel, { marginTop: 12 }]}>SELECT SAMITI</Text>
              <View style={s.pickerWrap}>
                <Picker
                  selectedValue={samiti.samiti_id}
                  onValueChange={val => { const f = samitiList.find(sm => sm.samiti_id === val); if (f) setSamiti(f); }}
                  dropdownIconColor={C.teal}
                  style={{ color: C.textPri }}
                >
                  {samitiList.map(sm => (
                    <Picker.Item key={sm.samiti_id} label={`${sm.samiti_name} (${sm.code_4digit})`} value={sm.samiti_id} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <View style={s.divider} />

          <Text style={s.cardLabel}>MILK QUANTITY (LITERS)</Text>
          <View style={s.row}>
            <TextInput
              style={[s.input, { flex: 1, fontSize: 24, fontWeight: '700' }]}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={C.textTer}
            />
            <View style={s.unitBadge}><Text style={s.unitTxt}>L</Text></View>
          </View>

          <View style={s.quickRow}>
            {['100', '200', '300', '500'].map(v => (
              <TouchableOpacity key={v} style={s.quickBtn} onPress={() => setQuantity(v)}>
                <Text style={s.quickTxt}>{v}L</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitTxt}>Submit Entry</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Today's entries ── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Today's Entries</Text>
        <View style={s.countChip}><Text style={s.countTxt}>{entries.length}</Text></View>
      </View>

      {loadingEntries ? <ActivityIndicator color={C.teal} style={{ marginTop: 24 }} /> : (
        <FlatList
          data={entries}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEntries(); }} tintColor={C.teal} />}
          renderItem={({ item }) => (
            <View style={s.entryCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.entryName}>{item.samiti_name}</Text>
                <Text style={s.entryTime}>{fmt(item.created_at)}</Text>
              </View>
              <View style={[s.shiftChip, { backgroundColor: item.shift === 'morning' ? '#FFF3E0' : '#EDE7F6' }]}>
                <Text style={[s.shiftTxt, { color: item.shift === 'morning' ? C.morning : C.purple }]}>
                  {item.shift === 'morning' ? 'Morning' : 'Evening'}
                </Text>
              </View>
              <Text style={s.entryQty}>{parseFloat(item.milk_quantity_liters).toFixed(1)}L</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={s.empty}>No entries for this shift yet.</Text>}
        />
      )}

      <Snackbar
        visible={!!snackMsg} onDismiss={() => setSnackMsg('')} duration={3500}
        style={{ backgroundColor: snackError ? C.errorBg : C.successBg, margin: 16, borderRadius: 12 }}
      >
        <Text style={{ color: snackError ? C.error : C.success, fontWeight: '500' }}>{snackMsg}</Text>
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },

  // Top bar
  topBar:       { backgroundColor: C.white, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border },
  topDate:      { fontSize: 12, color: C.textSec },
  topTitle:     { fontSize: 20, fontWeight: '800', color: C.textPri, letterSpacing: -0.5 },
  segWrap:      { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 10, padding: 3, gap: 2, marginRight: 10 },
  seg:          { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  segActive:    { backgroundColor: C.teal },
  segTxt:       { color: C.textSec, fontSize: 11, fontWeight: '600' },
  segTxtActive: { color: '#fff', fontWeight: '700' },
  logoutBtn:    { width: 36, height: 36, backgroundColor: '#FF3B3015', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // Cards
  card:         { marginHorizontal: 16, marginTop: 12, backgroundColor: C.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, overflow: 'hidden' },
  tealAccent:   { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: C.teal },
  cardLabel:    { fontSize: 10, fontWeight: '700', color: C.textSec, letterSpacing: 1, marginBottom: 8 },

  // Search
  row:          { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input:        { flex: 1, height: 52, backgroundColor: C.inputFill, borderRadius: 12, paddingHorizontal: 14, color: C.textPri, fontSize: 15 },
  searchBtn:    { height: 52, paddingHorizontal: 18, backgroundColor: C.teal, borderRadius: 12, justifyContent: 'center' },
  searchBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Samiti
  samitiName:   { fontSize: 18, fontWeight: '700', color: C.textPri },
  samitiFound:  { color: C.teal, fontSize: 12, fontWeight: '600', marginTop: 2 },
  codeBadge:    { backgroundColor: '#E0F2F1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  codeText:     { color: C.teal, fontWeight: '800', fontSize: 20, letterSpacing: 2 },
  pickerWrap:   { backgroundColor: C.inputFill, borderRadius: 12, overflow: 'hidden', marginBottom: 4 },
  divider:      { height: 1, backgroundColor: C.border, marginVertical: 14 },

  // Quantity
  unitBadge:    { width: 52, height: 52, backgroundColor: C.inputFill, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  unitTxt:      { color: C.textSec, fontSize: 18, fontWeight: '700' },
  quickRow:     { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 14 },
  quickBtn:     { flex: 1, backgroundColor: '#E0F2F1', borderRadius: 100, paddingVertical: 8, alignItems: 'center' },
  quickTxt:     { color: C.teal, fontSize: 12, fontWeight: '700' },

  // Submit
  submitBtn:    { height: 56, backgroundColor: C.teal, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: C.teal, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6 },
  submitTxt:    { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10, gap: 8 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: C.textPri },
  countChip:     { backgroundColor: C.primaryFixed, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countTxt:      { color: C.primary, fontSize: 12, fontWeight: '700' },

  // Entry cards
  entryCard:    { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  entryName:    { fontSize: 14, fontWeight: '600', color: C.textPri },
  entryTime:    { fontSize: 12, color: C.textSec, marginTop: 2 },
  shiftChip:    { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, marginHorizontal: 8 },
  shiftTxt:     { fontSize: 11, fontWeight: '600' },
  entryQty:     { fontSize: 16, fontWeight: '800', color: C.teal },
  empty:        { textAlign: 'center', color: C.textSec, marginTop: 48, fontSize: 14 },
});
