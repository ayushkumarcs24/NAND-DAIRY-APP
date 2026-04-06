import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import {
  Text, Button, Card, Chip, ActivityIndicator,
  SegmentedButtons, Divider, DataTable,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import { DairyTheme } from '../../constants/Theme';

interface Samiti { id: number; name: string; code_4digit: string; }
interface DailyRow { samiti_name: string; samiti_code: string; total_milk: string; avg_fat: string; avg_snf: string; total_amount: string; }
interface BillRow { date: string; milk: string; fat: string; snf: string; rate: string; amount: string; }

const fmt = (n: string | number) => parseFloat(String(n) || '0').toFixed(2);
const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-IN'); } catch { return iso; }
};

export default function ReportScreen() {
  const [tab, setTab] = useState<'daily' | 'bill'>('daily');

  // Daily report state
  const [dailyDate, setDailyDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dailyData, setDailyData] = useState<DailyRow[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Bill state
  const [samitis, setSamitis] = useState<Samiti[]>([]);
  const [selectedSamiti, setSelectedSamiti] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 9); return d;
  });
  const [toDate, setToDate] = useState(new Date());
  const [billData, setBillData] = useState<BillRow[]>([]);
  const [billLoading, setBillLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const toYMD = (d: Date) => d.toISOString().split('T')[0];

  const fetchSamitis = useCallback(async () => {
    try {
      const res = await api.get('/samitis');
      setSamitis(res.data);
      if (res.data.length > 0) setSelectedSamiti(res.data[0].id);
    } catch {}
  }, []);

  useEffect(() => { fetchSamitis(); }, [fetchSamitis]);

  const fetchDaily = useCallback(async () => {
    setDailyLoading(true);
    try {
      const res = await api.get(`/reports/daily?date=${toYMD(dailyDate)}`);
      setDailyData(res.data);
    } catch {} finally { setDailyLoading(false); setRefreshing(false); }
  }, [dailyDate]);

  const fetchBill = useCallback(async () => {
    if (!selectedSamiti) return;
    setBillLoading(true);
    try {
      const res = await api.get(`/reports/bill?samiti_id=${selectedSamiti}&from_date=${toYMD(fromDate)}&to_date=${toYMD(toDate)}`);
      setBillData(res.data);
    } catch {} finally { setBillLoading(false); setRefreshing(false); }
  }, [selectedSamiti, fromDate, toDate]);

  useEffect(() => { if (tab === 'daily') fetchDaily(); }, [tab, fetchDaily]);
  useEffect(() => { if (tab === 'bill') fetchBill(); }, [tab, fetchBill]);

  const totalMilk = dailyData.reduce((s, r) => s + parseFloat(r.total_milk || '0'), 0);
  const totalAmount = dailyData.reduce((s, r) => s + parseFloat(r.total_amount || '0'), 0);
  const billTotal = billData.reduce((s, r) => s + parseFloat(r.amount || '0'), 0);
  const billMilk = billData.reduce((s, r) => s + parseFloat(r.milk || '0'), 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F9FC' }}>
      <SegmentedButtons
        value={tab}
        onValueChange={v => setTab(v as any)}
        buttons={[
          { value: 'daily', label: '📋 Daily Summary' },
          { value: 'bill', label: '🧾 10-Day Bill' },
        ]}
        style={styles.tabBar}
      />

      {/* ── DAILY TAB ── */}
      {tab === 'daily' && (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDaily(); }} />}
        >
          <View style={styles.dateRow}>
            <Text variant="labelLarge">📅 Date:</Text>
            <Button onPress={() => setShowDatePicker(true)} mode="outlined" compact style={{ marginLeft: 8 }}>
              {toYMD(dailyDate)}
            </Button>
            <Button onPress={fetchDaily} mode="contained" compact style={{ marginLeft: 'auto' }}>Load</Button>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={dailyDate}
              mode="date"
              display="default"
              onChange={(_, d) => { setShowDatePicker(false); if (d) setDailyDate(d); }}
            />
          )}

          {dailyLoading ? <ActivityIndicator style={{ marginTop: 40 }} color={DairyTheme.colors.primary} /> : (
            <>
              <DataTable>
                <DataTable.Header style={styles.tableHeader}>
                  <DataTable.Title style={{ flex: 2 }}>Samiti</DataTable.Title>
                  <DataTable.Title numeric>Milk(L)</DataTable.Title>
                  <DataTable.Title numeric>FAT</DataTable.Title>
                  <DataTable.Title numeric>SNF</DataTable.Title>
                  <DataTable.Title numeric>₹</DataTable.Title>
                </DataTable.Header>

                {dailyData.map((r, i) => (
                  <DataTable.Row key={i} style={i % 2 === 0 ? styles.rowEven : undefined}>
                    <DataTable.Cell style={{ flex: 2 }}>
                      <View>
                        <Text variant="bodySmall" style={{ fontWeight: 'bold' }}>{r.samiti_name}</Text>
                        <Text variant="bodySmall" style={{ color: DairyTheme.colors.primary }}>{r.samiti_code}</Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>{fmt(r.total_milk)}</DataTable.Cell>
                    <DataTable.Cell numeric>{fmt(r.avg_fat)}%</DataTable.Cell>
                    <DataTable.Cell numeric>{fmt(r.avg_snf)}%</DataTable.Cell>
                    <DataTable.Cell numeric>{fmt(r.total_amount)}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>

              {dailyData.length === 0 && (
                <Text style={styles.empty}>No data for this date.</Text>
              )}

              {dailyData.length > 0 && (
                <Card style={styles.totalCard}>
                  <Card.Content style={styles.totalRow}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Grand Total</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="bodyMedium">🥛 {totalMilk.toFixed(2)} L</Text>
                      <Text variant="titleLarge" style={{ color: '#2E7D32', fontWeight: 'bold' }}>₹{totalAmount.toFixed(2)}</Text>
                    </View>
                  </Card.Content>
                </Card>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ── BILL TAB ── */}
      {tab === 'bill' && (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBill(); }} />}
        >
          <View style={styles.billControls}>
            <Text variant="labelLarge" style={{ marginBottom: 4 }}>Select Samiti</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={selectedSamiti} onValueChange={v => setSelectedSamiti(v)}>
                {samitis.map(s => <Picker.Item key={s.id} label={`${s.name} (${s.code_4digit})`} value={s.id} />)}
              </Picker>
            </View>

            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text variant="labelSmall">From</Text>
                <Button mode="outlined" compact onPress={() => setShowDatePicker(true)}>{toYMD(fromDate)}</Button>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="labelSmall">To</Text>
                <Button mode="outlined" compact onPress={() => setShowDatePicker(true)}>{toYMD(toDate)}</Button>
              </View>
              <Button mode="contained" onPress={fetchBill} style={{ alignSelf: 'flex-end', marginLeft: 8 }}>Load</Button>
            </View>
          </View>

          <Divider />

          {billLoading ? <ActivityIndicator style={{ marginTop: 40 }} color={DairyTheme.colors.primary} /> : (
            <>
              <DataTable>
                <DataTable.Header style={styles.tableHeader}>
                  <DataTable.Title>Date</DataTable.Title>
                  <DataTable.Title numeric>Milk</DataTable.Title>
                  <DataTable.Title numeric>FAT</DataTable.Title>
                  <DataTable.Title numeric>SNF</DataTable.Title>
                  <DataTable.Title numeric>₹</DataTable.Title>
                </DataTable.Header>

                {billData.map((r, i) => (
                  <DataTable.Row key={i} style={i % 2 === 0 ? styles.rowEven : undefined}>
                    <DataTable.Cell>{fmtDate(r.date)}</DataTable.Cell>
                    <DataTable.Cell numeric>{fmt(r.milk)}L</DataTable.Cell>
                    <DataTable.Cell numeric>{fmt(r.fat)}%</DataTable.Cell>
                    <DataTable.Cell numeric>{fmt(r.snf)}%</DataTable.Cell>
                    <DataTable.Cell numeric>₹{fmt(r.amount)}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>

              {billData.length === 0 && <Text style={styles.empty}>No data for this range.</Text>}

              {billData.length > 0 && (
                <Card style={styles.totalCard}>
                  <Card.Content style={styles.totalRow}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Bill Total</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="bodyMedium">🥛 {billMilk.toFixed(2)} L</Text>
                      <Text variant="titleLarge" style={{ color: '#2E7D32', fontWeight: 'bold' }}>₹{billTotal.toFixed(2)}</Text>
                    </View>
                  </Card.Content>
                </Card>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { margin: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  tableHeader: { backgroundColor: '#E3F2FD' },
  rowEven: { backgroundColor: '#FAFAFA' },
  totalCard: { margin: 12, borderRadius: 12, backgroundColor: '#E8F5E9' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  billControls: { padding: 12 },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12 },
});
