import React, { useState, useEffect, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, RefreshControl,
} from 'react-native';
import {
  Text, TextInput, Button, Card, Chip, Snackbar,
  SegmentedButtons, ActivityIndicator, Divider,
} from 'react-native-paper';
import api from '../../services/api';
import { DairyTheme } from '../../constants/Theme';

interface SamitiResult { samiti_id: number; samiti_name: string; code_4digit: string; }
interface MilkEntry { id: number; samiti_name: string; code_4digit: string; shift: string; milk_quantity_liters: string; created_at: string; }

const today = new Date().toISOString().split('T')[0];

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
    setSearching(true);
    setSamiti(null);
    try {
      const res = await api.get(`/vehicles/search/${vehicleNumber.trim().toUpperCase()}`);
      setSamiti(res.data);
    } catch {
      setSnackError(true);
      setSnackMsg('Vehicle not found. Check the number or ask admin to assign it.');
    } finally { setSearching(false); }
  };

  const handleSubmit = async () => {
    if (!samiti || !quantity) { setSnackError(true); setSnackMsg('Search for vehicle and enter quantity'); return; }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) { setSnackError(true); setSnackMsg('Enter a valid quantity'); return; }

    setSubmitting(true);
    try {
      await api.post('/milk-entries', {
        samiti_id: samiti.samiti_id,
        shift,
        entry_date: today,
        milk_quantity_liters: qty,
      });
      setSnackError(false);
      setSnackMsg(`✅ Entry saved — ${samiti.samiti_name}, ${qty}L ${shift}`);
      setSamiti(null);
      setVehicleNumber('');
      setQuantity('');
      fetchEntries();
    } catch (e: any) {
      setSnackError(true);
      setSnackMsg(e.response?.data?.error || 'Failed to submit entry');
    } finally { setSubmitting(false); }
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }
    catch { return ''; }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Date & Shift Toggle */}
        <View style={styles.topBar}>
          <Text variant="labelLarge" style={styles.dateText}>📅 {today}</Text>
          <SegmentedButtons
            value={shift}
            onValueChange={v => { setShift(v as any); fetchEntries(v); }}
            buttons={[
              { value: 'morning', label: '🌅 Morning' },
              { value: 'evening', label: '🌆 Evening' },
            ]}
            style={{ flex: 1 }}
          />
        </View>

        {/* Vehicle Search */}
        <View style={styles.searchRow}>
          <TextInput
            label="Vehicle Number"
            mode="outlined"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            style={{ flex: 1, backgroundColor: '#fff' }}
            autoCapitalize="characters"
            right={<TextInput.Icon icon="magnify" onPress={handleSearch} />}
            onSubmitEditing={handleSearch}
          />
          <Button
            mode="contained"
            onPress={handleSearch}
            loading={searching}
            style={styles.searchBtn}
          >
            Search
          </Button>
        </View>

        {/* Samiti Result Card */}
        {samiti && (
          <Card style={styles.samitiCard}>
            <Card.Content style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>{samiti.samiti_name}</Text>
                <Text variant="bodySmall" style={{ color: '#888' }}>Samiti found ✓</Text>
              </View>
              <Chip
                style={{ backgroundColor: DairyTheme.colors.primary }}
                textStyle={{ color: '#fff', fontSize: 22, fontWeight: 'bold', letterSpacing: 3 }}
              >
                {samiti.code_4digit}
              </Chip>
            </Card.Content>
            <Divider />
            <Card.Content style={{ paddingTop: 12 }}>
              <TextInput
                label="Milk Quantity (Liters)"
                mode="outlined"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                style={{ backgroundColor: '#fff' }}
                right={<TextInput.Affix text="L" />}
              />
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                style={{ marginTop: 12, paddingVertical: 4 }}
                icon="check-circle"
              >
                Submit Entry
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Today's Entries */}
        <Text variant="titleSmall" style={styles.listHeader}>
          Today's Entries ({entries.length})
        </Text>

        {loadingEntries ? <ActivityIndicator style={{ marginTop: 20 }} color={DairyTheme.colors.primary} /> : (
          <FlatList
            data={entries}
            keyExtractor={item => String(item.id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEntries(); }} />}
            renderItem={({ item }) => (
              <Card style={styles.entryCard}>
                <Card.Content style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>{item.samiti_name}</Text>
                    <Text variant="bodySmall" style={{ color: '#888' }}>{formatTime(item.created_at)}</Text>
                  </View>
                  <Chip compact style={{ backgroundColor: '#E3F2FD' }} textStyle={{ color: '#1976D2' }}>
                    {item.code_4digit}
                  </Chip>
                  <Text variant="titleMedium" style={{ marginLeft: 12, fontWeight: 'bold', color: DairyTheme.colors.primary }}>
                    {parseFloat(item.milk_quantity_liters).toFixed(1)}L
                  </Text>
                </Card.Content>
              </Card>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No entries for this shift yet.</Text>}
          />
        )}
      </View>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={3500}
        style={{ backgroundColor: snackError ? '#B71C1C' : '#1B5E20' }}
      >
        {snackMsg}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FC', padding: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dateText: { color: '#555', marginRight: 8 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchBtn: { alignSelf: 'flex-end', paddingHorizontal: 4 },
  samitiCard: { marginBottom: 12, borderRadius: 12, backgroundColor: '#fff', elevation: 3 },
  listHeader: { color: '#555', marginBottom: 8, fontWeight: 'bold' },
  entryCard: { marginBottom: 8, borderRadius: 10, backgroundColor: '#fff' },
  entryRow: { flexDirection: 'row', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});
