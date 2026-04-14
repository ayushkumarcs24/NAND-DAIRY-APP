import React, { useEffect, useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl,
  Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, ScrollView,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface Samiti { id: number; name: string; code_4digit: string; }
interface VehicleSamiti { samiti_id: number; samiti_name: string; samiti_code: string; }
interface Vehicle { id: number; vehicle_number: string; samitis: VehicleSamiti[]; }

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [samitis, setSamitis] = useState<Samiti[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add vehicle modal
  const [addVehicleVisible, setAddVehicleVisible] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Assign samiti modal
  const [assignVisible, setAssignVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedSamiti, setSelectedSamiti] = useState<number | null>(null);
  const [savingAssign, setSavingAssign] = useState(false);

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

  // Step 1: Create the vehicle
  const handleAddVehicle = async () => {
    if (!vehicleNumber.trim()) {
      setSnackErr(true); setSnackMsg('Vehicle number is required'); return;
    }
    try {
      setSavingVehicle(true);
      await api.post('/vehicles', { vehicle_number: vehicleNumber.trim().toUpperCase() });
      setAddVehicleVisible(false);
      setVehicleNumber('');
      setSnackErr(false); setSnackMsg('Vehicle added! Now assign samitis to it.');
      fetchData();
    } catch (e: any) {
      setSnackErr(true); setSnackMsg(e.response?.data?.error || 'Failed to add vehicle');
    } finally { setSavingVehicle(false); }
  };

  // Step 2: Assign a samiti to an existing vehicle
  const openAssign = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    if (samitis.length > 0) setSelectedSamiti(samitis[0].id);
    setAssignVisible(true);
  };

  const handleAssignSamiti = async () => {
    if (!selectedVehicle || !selectedSamiti) {
      setSnackErr(true); setSnackMsg('Select a samiti to assign'); return;
    }
    try {
      setSavingAssign(true);
      await api.post(`/vehicles/${selectedVehicle.id}/samitis`, { samiti_id: selectedSamiti });
      setAssignVisible(false);
      setSnackErr(false); setSnackMsg('Samiti assigned to vehicle!');
      fetchData();
    } catch (e: any) {
      setSnackErr(true); setSnackMsg(e.response?.data?.error || 'Failed to assign samiti');
    } finally { setSavingAssign(false); }
  };

  // Remove a single samiti mapping from a vehicle
  const handleRemoveSamiti = async (vehicleId: number, samitiId: number) => {
    try {
      await api.delete(`/vehicles/${vehicleId}/samitis/${samitiId}`);
      setSnackErr(false); setSnackMsg('Samiti removed from vehicle');
      fetchData();
    } catch { setSnackErr(true); setSnackMsg('Failed to remove samiti'); }
  };

  // Delete entire vehicle
  const handleDeleteVehicle = async (id: number) => {
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
            <TouchableOpacity style={s.addBtn} onPress={() => setAddVehicleVisible(true)}>
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
              {/* Show all mapped samitis as chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {item.samitis.length === 0
                  ? <Text style={s.noSamiti}>No samitis assigned</Text>
                  : item.samitis.map(sm => (
                    <TouchableOpacity
                      key={sm.samiti_id}
                      style={s.samitiChip}
                      onLongPress={() => handleRemoveSamiti(item.id, sm.samiti_id)}
                    >
                      <Text style={s.samitiChipText}>{sm.samiti_name} ({sm.samiti_code})</Text>
                      <Text style={s.chipRemove}> ✕</Text>
                    </TouchableOpacity>
                  ))
                }
              </ScrollView>
              <Text style={s.hintText}>Long-press a samiti chip to remove it · Tap + to add</Text>
            </View>
            <View style={{ gap: 6 }}>
              <TouchableOpacity style={s.assignBtn} onPress={() => openAssign(item)}>
                <Text style={{ fontSize: 14 }}>＋</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteVehicle(item.id)}>
                <Text style={{ fontSize: 14 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No vehicles added yet.</Text>}
      />

      {/* ── Modal: Add New Vehicle ── */}
      <Modal visible={addVehicleVisible} animationType="slide" transparent onRequestClose={() => setAddVehicleVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add Vehicle</Text>
            <Text style={s.inputLabel}>Vehicle Number</Text>
            <TextInput
              style={s.inputField}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="e.g. RJ14XX1234"
              placeholderTextColor={C.textTer}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={[s.primaryBtn, savingVehicle && { opacity: 0.7 }]} onPress={handleAddVehicle} disabled={savingVehicle}>
              {savingVehicle ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>Add Vehicle</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => setAddVehicleVisible(false)}>
              <Text style={s.ghostBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Assign Samiti to Vehicle ── */}
      <Modal visible={assignVisible} animationType="slide" transparent onRequestClose={() => setAssignVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Assign Samiti</Text>
            <Text style={s.assignSubtitle}>Vehicle: {selectedVehicle?.vehicle_number}</Text>
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
            <TouchableOpacity style={[s.primaryBtn, savingAssign && { opacity: 0.7 }]} onPress={handleAssignSamiti} disabled={savingAssign}>
              {savingAssign ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>Assign Samiti</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => setAssignVisible(false)}>
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
  screen:          { flex: 1, backgroundColor: C.bg },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  listHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  listTitle:       { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  countBadge:      { backgroundColor: C.surfaceVar, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText:       { color: '#fff', fontSize: 12, fontWeight: '600' },
  addBtn:          { backgroundColor: C.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  addBtnText:      { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 26 },
  card:            { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  truckIcon:       { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary + '22', justifyContent: 'center', alignItems: 'center' },
  vehicleNum:      { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5, fontFamily: 'monospace' },
  samitiChip:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primary + '33', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 },
  samitiChipText:  { color: C.primary, fontSize: 11, fontWeight: '600' },
  chipRemove:      { color: C.error, fontSize: 10, fontWeight: '700' },
  noSamiti:        { color: C.textTer, fontSize: 11, fontStyle: 'italic' },
  hintText:        { color: C.textTer, fontSize: 10, marginTop: 4 },
  assignBtn:       { backgroundColor: C.primary + '33', borderRadius: 8, padding: 6, alignItems: 'center' },
  deleteBtn:       { padding: 6 },
  empty:           { textAlign: 'center', color: C.textSec, marginTop: 80, fontSize: 15 },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:       { backgroundColor: '#1c1c1e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:      { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4, letterSpacing: -0.3 },
  assignSubtitle:  { color: C.textSec, fontSize: 13, marginBottom: 18 },
  inputLabel:      { color: C.textSec, fontSize: 12, marginBottom: 6, letterSpacing: 0.1 },
  inputField:      { backgroundColor: C.surfaceVar, borderRadius: 10, color: '#fff', fontSize: 15, paddingHorizontal: 14, height: 46, marginBottom: 14 },
  pickerWrap:      { backgroundColor: C.surfaceVar, borderRadius: 10, marginBottom: 20, overflow: 'hidden' },
  primaryBtn:      { backgroundColor: C.primary, borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  primaryBtnText:  { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  ghostBtn:        { height: 44, justifyContent: 'center', alignItems: 'center' },
  ghostBtnText:    { color: C.primary, fontSize: 15, fontWeight: '500' },
});
