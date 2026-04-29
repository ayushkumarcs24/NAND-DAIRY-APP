import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface DailyRow { samiti_name: string; samiti_code: string; total_milk: string; avg_fat: string; avg_snf: string; total_amount: string; }
interface BillRow  { date: string; milk: string; fat: string; snf: string; rate: string; amount: string; }
interface Samiti   { id: number; name: string; code_4digit: string; }

const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

export default function ReportsScreen() {
  const { user, signOut } = useAuth();
  const [tab, setTab]               = useState<'daily' | 'bill'>('daily');
  const [samitis, setSamitis]       = useState<Samiti[]>([]);
  const [selSamiti, setSelSamiti]   = useState<Samiti | null>(null);
  const [today] = useState(new Date().toISOString().split('T')[0]);
  const [date, setDate]             = useState(today);
  const [daily, setDaily]           = useState<DailyRow[]>([]);
  const [bill, setBill]             = useState<BillRow[]>([]);
  const [loading, setLoading]       = useState(false);
  const [summary, setSummary]       = useState<any>(null);

  useEffect(() => {
    api.get('/samitis').then(r => { setSamitis(r.data); if (r.data.length) setSelSamiti(r.data[0]); }).catch(() => {});
    api.get('/reports/summary').then(r => setSummary(r.data)).catch(() => {});
    fetchDaily(today);
  }, []);

  const fetchDaily = async (d: string) => {
    setLoading(true);
    try { const r = await api.get(`/reports/daily?date=${d}`); setDaily(r.data); }
    catch { } finally { setLoading(false); }
  };

  const fetchBill = async () => {
    if (!selSamiti) return;
    setLoading(true);
    const from = new Date(); from.setDate(from.getDate() - 29);
    const fromStr = from.toISOString().split('T')[0];
    try { const r = await api.get(`/reports/bill?samiti_id=${selSamiti.id}&from_date=${fromStr}&to_date=${today}`); setBill(r.data); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'bill') fetchBill(); }, [tab, selSamiti]);

  const totalMilk   = daily.reduce((a, r) => a + parseFloat(r.total_milk  || '0'), 0);
  const totalPayout = daily.reduce((a, r) => a + parseFloat(r.total_amount || '0'), 0);

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 48 }}>

      {/* ── Hero banner ── */}
      <View style={[s.hero, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={s.heroDate}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} • Hello, {user?.name?.split(' ')[0]}</Text>
            <Text style={s.heroTitle}>Reports</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={s.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.heroStats}>
          <View style={s.heroStat}>
            <Text style={s.heroStatVal}>{summary ? parseFloat(summary.summary?.total_milk || '0').toFixed(0) : '—'}</Text>
            <Text style={s.heroStatLbl}>Liters (7d)</Text>
          </View>
          <View style={s.heroDiv} />
          <View style={s.heroStat}>
            <Text style={s.heroStatVal}>₹{summary ? parseFloat(summary.summary?.total_payout || '0').toFixed(0) : '—'}</Text>
            <Text style={s.heroStatLbl}>Payout (7d)</Text>
          </View>
          <View style={s.heroDiv} />
          <View style={s.heroStat}>
            <Text style={s.heroStatVal}>{summary ? (summary.summary?.active_samitis || '—') : '—'}</Text>
            <Text style={s.heroStatLbl}>Samitis</Text>
          </View>
        </View>
      </View>

      {/* ── Tab switcher ── */}
      <View style={s.tabRow}>
        {(['daily', 'bill'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
              {t === 'daily' ? '📅 Daily Report' : '🧾 Samiti Bill'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator color={C.blue} style={{ marginTop: 24 }} />}

      {/* ── Daily report ── */}
      {tab === 'daily' && !loading && (
        <>
          {/* Summary cards */}
          <View style={s.statRow}>
            <View style={[s.statCard, { borderTopColor: C.blue }]}>
              <Text style={s.statVal}>{totalMilk.toFixed(1)}</Text>
              <Text style={s.statLbl}>Total Liters</Text>
            </View>
            <View style={[s.statCard, { borderTopColor: C.success }]}>
              <Text style={s.statVal}>₹{totalPayout.toFixed(0)}</Text>
              <Text style={s.statLbl}>Total Payout</Text>
            </View>
            <View style={[s.statCard, { borderTopColor: C.coral }]}>
              <Text style={s.statVal}>{daily.length}</Text>
              <Text style={s.statLbl}>Samitis</Text>
            </View>
          </View>

          {/* Table */}
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.th, { flex: 2 }]}>SAMITI</Text>
              <Text style={s.th}>MILK</Text>
              <Text style={s.th}>FAT</Text>
              <Text style={s.th}>SNF</Text>
              <Text style={s.th}>AMOUNT</Text>
            </View>
            {daily.map((r, i) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 && { backgroundColor: C.surfaceLow }]}>
                <Text style={[s.td, { flex: 2, color: C.textPri, fontWeight: '600' }]}>{r.samiti_name}</Text>
                <Text style={s.td}>{parseFloat(r.total_milk).toFixed(1)}</Text>
                <Text style={s.td}>{r.avg_fat || '—'}</Text>
                <Text style={s.td}>{r.avg_snf || '—'}</Text>
                <Text style={[s.td, { color: C.success, fontWeight: '600' }]}>₹{parseFloat(r.total_amount || '0').toFixed(0)}</Text>
              </View>
            ))}
            {daily.length === 0 && <Text style={s.empty}>No entries for today.</Text>}
          </View>
        </>
      )}

      {/* ── Bill report ── */}
      {tab === 'bill' && !loading && (
        <>
          {/* Samiti chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {samitis.map(sm => (
              <TouchableOpacity key={sm.id} style={[s.chip, selSamiti?.id === sm.id && s.chipActive]} onPress={() => setSelSamiti(sm)}>
                <Text style={[s.chipTxt, selSamiti?.id === sm.id && s.chipTxtActive]}>{sm.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selSamiti && (
            <View style={s.billSummary}>
              <Text style={s.billSamiti}>{selSamiti.name}</Text>
              <Text style={s.billPeriod}>Last 30 days</Text>
              <Text style={s.billTotal}>
                ₹{bill.reduce((a, r) => a + parseFloat(r.amount || '0'), 0).toFixed(2)}
              </Text>
            </View>
          )}

          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.th, { flex: 1.2 }]}>DATE</Text>
              <Text style={s.th}>MILK</Text>
              <Text style={s.th}>FAT</Text>
              <Text style={s.th}>RATE</Text>
              <Text style={s.th}>AMOUNT</Text>
            </View>
            {bill.map((r, i) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 && { backgroundColor: C.surfaceLow }]}>
                <Text style={[s.td, { flex: 1.2 }]}>{fmt(r.date)}</Text>
                <Text style={s.td}>{parseFloat(r.milk).toFixed(1)}</Text>
                <Text style={s.td}>{r.fat}</Text>
                <Text style={s.td}>₹{r.rate}</Text>
                <Text style={[s.td, { color: C.success, fontWeight: '600' }]}>₹{parseFloat(r.amount).toFixed(2)}</Text>
              </View>
            ))}
            {bill.length === 0 && <Text style={s.empty}>No data for this samiti.</Text>}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: C.bg },

  // Hero
  hero:        { backgroundColor: C.blue, padding: 24, paddingTop: 20 },
  heroDate:    { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroTitle:   { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 16, letterSpacing: -0.5 },
  logoutBtn:   { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  heroStats:   { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 },
  heroStat:    { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroStatLbl: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  heroDiv:     { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Tabs
  tabRow:      { flexDirection: 'row', margin: 16, backgroundColor: C.surface, borderRadius: 12, padding: 4, gap: 4 },
  tabBtn:      { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabBtnActive:{ backgroundColor: C.white },
  tabTxt:      { fontSize: 13, fontWeight: '600', color: C.textSec },
  tabTxtActive:{ color: C.blue, fontWeight: '700' },

  // Stat row
  statRow:     { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard:    { flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 14, borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statVal:     { fontSize: 18, fontWeight: '800', color: C.textPri },
  statLbl:     { fontSize: 11, color: C.textSec, marginTop: 2 },

  // Table
  table:       { marginHorizontal: 16, backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  tableHead:   { flexDirection: 'row', backgroundColor: C.surfaceHigh, paddingVertical: 10, paddingHorizontal: 12 },
  th:          { flex: 1, fontSize: 10, fontWeight: '700', color: C.textSec, letterSpacing: 0.5 },
  tableRow:    { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: C.white },
  td:          { flex: 1, fontSize: 12, color: C.textSec },
  empty:       { textAlign: 'center', color: C.textSec, padding: 24, fontSize: 14 },

  // Bill
  chipRow:     { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip:        { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: C.surface, borderRadius: 100 },
  chipActive:  { backgroundColor: C.blue },
  chipTxt:     { fontSize: 13, color: C.textSec, fontWeight: '500' },
  chipTxtActive:{ color: '#fff', fontWeight: '600' },
  billSummary: { marginHorizontal: 16, backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  billSamiti:  { fontSize: 18, fontWeight: '800', color: C.textPri },
  billPeriod:  { fontSize: 12, color: C.textSec, marginTop: 2 },
  billTotal:   { fontSize: 28, fontWeight: '800', color: C.success, marginTop: 8 },
});
