import React, { useEffect, useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl,
  Text, TextInput, TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';
import { C } from '../../constants/Theme';

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
  const [snackErr, setSnackErr] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [vRes, sRes] = await Promise.all([api.get('/vehicles'), api.get('/samitis')]);
      setVehicles(vRes.data);
      setSamitis(sRes.data);
      if (sRes.data.length > 0) setSelectedSamiti(sRes.data[0].id);
    } catch { setSnackErr(true); setSnackMsg('Failed to load data'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!vehicleNumber.trim() || !selectedSamiti) {
      setSnackErr(true); setSnackMsg('Vehicle number and samiti are required'); return;
    }
    try {
      setSaving(true);
      await api.post('/vehicles', { vehicle_number: vehicleNumber.trim().toUpperCase(), samiti_id: selectedSamiti });
      setVisible(false); setVehicleNumber('');
      setSnackErr(false); setSnackMsg('Vehicle assigned!');
      fetchData();
    } catch (e: any) {
      setSnackErr(true); setSnackMsg(e.response?.data?.error || 'Failed to assign vehicle');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
      setSnackErr(false); setSnackMsg('Vehicle removed');
    } catch { setSnackErr(true); setSnackMsg('Failed to remove vehicle'); }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
  );

  return (
    <View style={s.screen}>
      <FlatList
        data={vehicles}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={C.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.listTitle}>Vehicles</Text>
              <View style={s.countBadge}><Text style={s.countText}>{vehicles.length}</Text></View>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={() => setVisible(true)}>
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.truckIcon}>
              <Text style={{ fontSize: 22 }}>🚛</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.vehicleNum}>{item.vehicle_number}</Text>
              <Text style={s.samitiInfo}>
                {item.samiti_name}{' '}
                <Text style={{ color: C.primary, fontWeight: '700' }}>({item.samiti_code})</Text>
              </Text>
            </View>
            <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.id)}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No vehicles assigned yet.</Text>}
      />

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Assign Vehicle</Text>
            <Text style={s.inputLabel}>Vehicle Number</Text>
            <TextInput
              style={s.inputField}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="e.g. RJ14XX1234"
              placeholderTextColor={C.textTer}
              autoCapitalize="characters"
            />
            <Text style={s.inputLabel}>Select Samiti</Text>
            <View style={s.pickerWrap}>
              <Picker
                selectedValue={selectedSamiti}
                onValueChange={v => setSelectedSamiti(v)}
                dropdownIconColor={C.textSec}
                style={{ color: '#fff' }}
                itemStyle={{ color: '#fff', backgroundColor: C.surfaceVar }}
              >
                {samitis.map(s2 => (
                  <Picker.Item key={s2.id} label={`${s2.name} (${s2.code_4digit})`} value={s2.id} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity style={[s.primaryBtn, saving && { opacity: 0.7 }]} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>Assign Vehicle</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => setVisible(false)}>
              <Text style={s.ghostBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={!!snackMsg} onDismiss={() => setSnackMsg('')} duration={3000}
        style={{ backgroundColor: snackErr ? '#3a1212' : '#0d2a0d', margin: 16, borderRadius: 12 }}
      >
        <Text style={{ color: snackErr ? C.error : C.success }}>{snackMsg}</Text>
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: C.bg },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  listHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  listTitle:     { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  countBadge:    { backgroundColor: C.surfaceVar, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText:     { color: '#fff', fontSize: 12, fontWeight: '600' },
  addBtn:        { backgroundColor: C.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  addBtnText:    { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 26 },
  card:          { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  truckIcon:     { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary + '22', justifyContent: 'center', alignItems: 'center' },
  vehicleNum:    { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5, fontFamily: 'monospace' },
  samitiInfo:    { color: C.textSec, fontSize: 12, marginTop: 4 },
  deleteBtn:     { padding: 8 },
  empty:         { textAlign: 'center', color: C.textSec, marginTop: 80, fontSize: 15 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: '#1c1c1e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:    { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20, letterSpacing: -0.3 },
  inputLabel:    { color: C.textSec, fontSize: 12, marginBottom: 6, letterSpacing: 0.1 },
  inputField:    { backgroundColor: C.surfaceVar, borderRadius: 10, color: '#fff', fontSize: 15, paddingHorizontal: 14, height: 46, marginBottom: 14 },
  pickerWrap:    { backgroundColor: C.surfaceVar, borderRadius: 10, marginBottom: 20, overflow: 'hidden' },
  primaryBtn:    { backgroundColor: C.primary, borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  primaryBtnText:{ color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  ghostBtn:      { height: 44, justifyContent: 'center', alignItems: 'center' },
  ghostBtnText:  { color: C.primary, fontSize: 15, fontWeight: '500' },
});
