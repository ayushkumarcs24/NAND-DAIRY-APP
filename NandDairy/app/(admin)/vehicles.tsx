import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import {
  Text, FAB, Modal, Portal, TextInput, Button,
  Card, Snackbar, ActivityIndicator,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';
import { DairyTheme } from '../../constants/Theme';

interface Vehicle { id: number; vehicle_number: string; samiti_name: string; samiti_code: string; }
interface Samiti { id: number; name: string; code_4digit: string; }

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [samitis, setSamitis] = useState<Samiti[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedSamiti, setSelectedSamiti] = useState<number | null>(null);
  const [snackMsg, setSnackMsg] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [vRes, sRes] = await Promise.all([api.get('/vehicles'), api.get('/samitis')]);
      setVehicles(vRes.data);
      setSamitis(sRes.data);
      if (sRes.data.length > 0) setSelectedSamiti(sRes.data[0].id);
    } catch { setSnackMsg('Failed to load data'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!vehicleNumber.trim() || !selectedSamiti) {
      setSnackMsg('Vehicle number and samiti are required'); return;
    }
    try {
      setSaving(true);
      await api.post('/vehicles', { vehicle_number: vehicleNumber.trim().toUpperCase(), samiti_id: selectedSamiti });
      setVisible(false);
      setVehicleNumber('');
      setSnackMsg('Vehicle assigned!');
      fetchData();
    } catch (e: any) {
      setSnackMsg(e.response?.data?.error || 'Failed to assign vehicle');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
      setSnackMsg('Vehicle removed');
    } catch { setSnackMsg('Failed to remove vehicle'); }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={DairyTheme.colors.primary} /></View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>🚛 {item.vehicle_number}</Text>
                <Text variant="bodySmall" style={{ color: '#555', marginTop: 4 }}>
                  → {item.samiti_name} <Text style={{ color: DairyTheme.colors.primary, fontWeight: 'bold' }}>({item.samiti_code})</Text>
                </Text>
              </View>
              <Button
                icon="delete"
                mode="text"
                textColor="#D32F2F"
                compact
                onPress={() => handleDelete(item.id)}
              >
                Remove
              </Button>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No vehicles assigned yet. Tap + to assign one.</Text>}
      />

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.modalTitle}>Assign Vehicle</Text>
          <TextInput
            label="Vehicle Number"
            mode="outlined"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            style={styles.input}
            autoCapitalize="characters"
            placeholder="e.g. RJ14XX1234"
          />
          <Text variant="labelLarge" style={{ marginBottom: 4 }}>Select Samiti</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedSamiti}
              onValueChange={v => setSelectedSamiti(v)}
            >
              {samitis.map(s => (
                <Picker.Item key={s.id} label={`${s.name} (${s.code_4digit})`} value={s.id} />
              ))}
            </Picker>
          </View>
          <Button mode="contained" onPress={handleAdd} loading={saving} disabled={saving} style={{ marginTop: 16 }}>Assign Vehicle</Button>
          <Button onPress={() => setVisible(false)} style={{ marginTop: 8 }}>Cancel</Button>
        </Modal>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={() => setVisible(true)} color="#fff" />
      <Snackbar visible={!!snackMsg} onDismiss={() => setSnackMsg('')} duration={3000}>{snackMsg}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: 10, borderRadius: 12, backgroundColor: '#fff' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60 },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: DairyTheme.colors.primary },
  modal: { backgroundColor: '#fff', margin: 20, padding: 24, borderRadius: 16 },
  modalTitle: { fontWeight: 'bold', marginBottom: 16 },
  input: { marginBottom: 14, backgroundColor: '#fff' },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 4 },
});
