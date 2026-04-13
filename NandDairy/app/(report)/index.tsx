import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface Samiti { id: number; name: string; code_4digit: string; }
interface DailyRow { samiti_name: string; samiti_code: string; total_milk: string; avg_fat: string; avg_snf: string; total_amount: string; }
interface BillRow { date: string; milk: string; fat: string; snf: string; rate: string; amount: string; }

const fmt = (n: string | number) => parseFloat(String(n) || '0').toFixed(2);
const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString('en-IN'); } catch { return iso; } };
const toYMD = (d: Date) => d.toISOString().split('T')[0];

export default function ReportScreen() {
  const [tab, setTab] = useState<'daily' | 'bill'>('daily');
  const [dailyDate, setDailyDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dailyData, setDailyData] = useState<DailyRow[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [samitis, setSamitis] = useState<Samiti[]>([]);
  const [selectedSamiti, setSelectedSamiti] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 9); return d; });
  const [toDate, setToDate] = useState(new Date());
  const [billData, setBillData] = useState<BillRow[]>([]);
  const [billLoading, setBillLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSamitis = useCallback(async () => {
    try {
      const res = await api.get('/samitis');
      setSamitis(res.data);
      if (res.data.length > 0) setSelectedSamiti(res.data[0].id);
    } catch { }
  }, []);

  useEffect(() => { fetchSamitis(); }, [fetchSamitis]);

  const fetchDaily = useCallback(async () => {
    setDailyLoading(true);
    try {
      const res = await api.get(`/reports/daily?date=${toYMD(dailyDate)}`);
      setDailyData(res.data);
    } catch { } finally { setDailyLoading(false); setRefreshing(false); }
  }, [dailyDate]);

  const fetchBill = useCallback(async () => {
    if (!selectedSamiti) return;
    setBillLoading(true);
    try {
      const res = await api.get(`/reports/bill?samiti_id=${selectedSamiti}&from_date=${toYMD(fromDate)}&to_date=${toYMD(toDate)}`);
      setBillData(res.data);
    } catch { } finally { setBillLoading(false); setRefreshing(false); }
  }, [selectedSamiti, fromDate, toDate]);

  useEffect(() => { if (tab === 'daily') fetchDaily(); }, [tab, fetchDaily]);
  useEffect(() => { if (tab === 'bill') fetchBill(); }, [tab, fetchBill]);

  const totalMilk = dailyData.reduce((s, r) => s + parseFloat(r.total_milk || '0'), 0);
  const totalAmount = dailyData.reduce((s, r) => s + parseFloat(r.total_amount || '0'), 0);
  const billTotal = billData.reduce((s, r) => s + parseFloat(r.amount || '0'), 0);
  const billMilk = billData.reduce((s, r) => s + parseFloat(r.milk || '0'), 0);

  return (
    <View style={s.screen}>
      {/* Tab selector */}
      <View style={s.tabBar}>
        {(['daily', 'bill'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'daily' ? '📋 Daily Summary' : '🧾 10-Day Bill'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── DAILY TAB ── */}
      {tab === 'daily' && (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDaily(); }} tintColor={C.primary} />}>
          <View style={s.dateRow}>
            <Text style={s.dateRowLabel}>📅 Date:</Text>
            <TouchableOpacity style={s.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={s.dateBtnText}>{toYMD(dailyDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.loadBtn} onPress={fetchDaily}>
              <Text style={s.loadBtnText}>Load</Text>
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={dailyDate} mode="date" display="default"
              onChange={(_, d) => { setShowDatePicker(false); if (d) setDailyDate(d); }}
            />
          )}

          {dailyLoading ? <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /> : (
            <>
              {/* Table */}
              <View style={s.tableCard}>
                {/* Header */}
                <View style={[s.tableRow, s.tableHeader]}>
                  <Text style={[s.tableCell, s.headerCell, { flex: 2 }]}>Samiti</Text>
                  <Text style={[s.tableCell, s.headerCell, s.numCell]}>Milk(L)</Text>
                  <Text style={[s.tableCell, s.headerCell, s.numCell]}>FAT</Text>
                  <Text style={[s.tableCell, s.headerCell, s.numCell]}>SNF</Text>
                  <Text style={[s.tableCell, s.headerCell, s.numCell]}>₹</Text>
                </View>
                {dailyData.map((r, i) => (
                  <View key={i} style={[s.tableRow, i % 2 === 0 ? s.rowEven : s.rowOdd]}>
                    <View style={[s.tableCell, { flex: 2 }]}>
                      <Text style={s.cellText}>{r.samiti_name}</Text>
                      <Text style={{ color: C.primary, fontSize: 11 }}>{r.samiti_code}</Text>
                    </View>
                    <Text style={[s.tableCell, s.numCell, s.cellText]}>{fmt(r.total_milk)}</Text>
                    <Text style={[s.tableCell, s.numCell, s.cellText]}>{fmt(r.avg_fat)}%</Text>
                    <Text style={[s.tableCell, s.numCell, s.cellText]}>{fmt(r.avg_snf)}%</Text>
                    <Text style={[s.tableCell, s.numCell, s.cellText]}>{fmt(r.total_amount)}</Text>
                  </View>
                ))}
                {dailyData.length === 0 && <Text style={s.empty}>No data for this date.</Text>}
              </View>

              {dailyData.length > 0 && (
                <View style={s.totalCard}>
                  <Text style={s.totalLabel}>Grand Total</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.totalMilk}>🥛 {totalMilk.toFixed(2)} L</Text>
                    <Text style={s.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ── BILL TAB ── */}
      {tab === 'bill' && (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBill(); }} tintColor={C.primary} />}>
          <View style={s.billControls}>
            <Text style={s.billControlLabel}>Select Samiti</Text>
            <View style={s.pickerWrap}>
              <Picker selectedValue={selectedSamiti} onValueChange={v => setSelectedSamiti(v)} dropdownIconColor={C.textSec} style={{ color: '#fff' }}>
                {samitis.map(sm => <Picker.Item key={sm.id} label={`${sm.name} (${sm.code_4digit})`} value={sm.id} />)}
              </Picker>
            </View>
            <View style={s.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.dateRowLabel}>From</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setShowDatePicker(true)}>
                  <Text style={s.dateBtnText}>{toYMD(fromDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.dateRowLabel}>To</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setShowDatePicker(true)}>
                  <Text style={s.dateBtnText}>{toYMD(toDate)}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[s.loadBtn, { alignSelf: 'flex-end', marginLeft: 8 }]} onPress={fetchBill}>
                <Text style={s.loadBtnText}>Load</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.divider} />

          {billLoading ? <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /> : (
            <>
              <View style={s.tableCard}>
                <View style={[s.tableRow, s.tableHeader]}>
                  <Text style={[s.tableCell, s.headerCell]}>Date</Text>
                  <Text style={[s.tableCell, s.headerCell, s.numCell]}>Milk</Text>
                  <Text style={[s.tableCell, s.headerCell, s.numCell]}>FAT</Text>
                  <Text style={[s.tableCell, s.headerCell, s.numCell]}>SNF</Text>
                  <Text style={[s.tableCell, s.headerCell, s.numCell]}>₹</Text>
                </View>
                {billData.map((r, i) => (
                  <View key={i} style={[s.tableRow, i % 2 === 0 ? s.rowEven : s.rowOdd]}>
                    <Text style={[s.tableCell, s.cellText]}>{fmtDate(r.date)}</Text>
                    <Text style={[s.tableCell, s.numCell, s.cellText]}>{fmt(r.milk)}L</Text>
                    <Text style={[s.tableCell, s.numCell, s.cellText]}>{fmt(r.fat)}%</Text>
                    <Text style={[s.tableCell, s.numCell, s.cellText]}>{fmt(r.snf)}%</Text>
                    <Text style={[s.tableCell, s.numCell, s.cellText]}>₹{fmt(r.amount)}</Text>
                  </View>
                ))}
                {billData.length === 0 && <Text style={s.empty}>No data for this range.</Text>}
              </View>

              {billData.length > 0 && (
                <View style={s.totalCard}>
                  <Text style={s.totalLabel}>Bill Total</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.totalMilk}>🥛 {billMilk.toFixed(2)} L</Text>
                    <Text style={s.totalAmount}>₹{billTotal.toFixed(2)}</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: C.bg },
  tabBar:           { flexDirection: 'row', gap: 3, margin: 12, backgroundColor: C.surfaceVar, borderRadius: 12, padding: 4 },
  tabBtn:           { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabBtnActive:     { backgroundColor: C.primary },
  tabText:          { color: C.textSec, fontSize: 13, fontWeight: '500' },
  tabTextActive:    { color: '#fff', fontWeight: '600' },
  dateRow:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  dateRowLabel:     { color: C.textSec, fontSize: 13 },
  dateBtn:          { backgroundColor: C.surfaceVar, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  dateBtnText:      { color: '#fff', fontSize: 13 },
  loadBtn:          { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  loadBtnText:      { color: '#fff', fontWeight: '600', fontSize: 13 },
  tableCard:        { marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  tableRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  tableHeader:      { backgroundColor: '#0e0e0e' },
  rowEven:          { backgroundColor: C.surface },
  rowOdd:           { backgroundColor: '#1a1a1a' },
  tableCell:        { flex: 1 },
  headerCell:       { color: C.textSec, fontSize: 12, fontWeight: '600' },
  numCell:          { textAlign: 'right' },
  cellText:         { color: '#fff', fontSize: 13 },
  empty:            { textAlign: 'center', color: C.textSec, padding: 24, fontSize: 14 },
  totalCard:        { marginHorizontal: 16, marginBottom: 24, backgroundColor: '#0d1f0d', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  totalMilk:        { color: C.textSec, fontSize: 13, marginBottom: 4 },
  totalAmount:      { color: C.success, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  billControls:     { padding: 16 },
  billControlLabel: { color: C.textSec, fontSize: 12, marginBottom: 6 },
  pickerWrap:       { backgroundColor: C.surfaceVar, borderRadius: 10, marginBottom: 12, overflow: 'hidden' },
  divider:          { height: 1, backgroundColor: C.surfaceVar, marginHorizontal: 16, marginBottom: 12 },
});
