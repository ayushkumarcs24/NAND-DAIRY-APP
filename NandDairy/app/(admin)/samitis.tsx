import React, { useEffect, useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl,
  Text, TextInput, TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface Samiti { id: number; name: string; code_4digit: string; }

const BG_COLORS = ['#0071e3', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#BF5AF2', '#00C7BE'];

export default function SamitisScreen() {
  const [samitis, setSamitis] = useState<Samiti[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [snackMsg, setSnackMsg] = useState('');
  const [snackErr, setSnackErr] = useState(false);

  const fetchSamitis = useCallback(async () => {
    try {
      const res = await api.get('/samitis');
      setSamitis(res.data);
    } catch { setSnackErr(true); setSnackMsg('Failed to load samitis'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchSamitis(); }, [fetchSamitis]);

  const handleAdd = async () => {
    if (!name.trim()) { setSnackErr(true); setSnackMsg('Samiti name is required'); return; }
    try {
      setSaving(true);
      await api.post('/samitis', { name: name.trim() });
      setVisible(false); setName('');
      setSnackErr(false); setSnackMsg('Samiti added!');
      fetchSamitis();
    } catch (e: any) {
      setSnackErr(true); setSnackMsg(e.response?.data?.error || 'Failed to add samiti');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
  );

  return (
    <View style={s.screen}>
      <FlatList
        data={samitis}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSamitis(); }} tintColor={C.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.listTitle}>Samitis</Text>
              <View style={s.countBadge}><Text style={s.countText}>{samitis.length}</Text></View>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={() => setVisible(true)}>
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={s.card}>
            <View style={[s.iconBox, { backgroundColor: BG_COLORS[index % BG_COLORS.length] + '22' }]}>
              <Text style={{ fontSize: 22 }}>🏢</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.samitiName}>{item.name}</Text>
              <Text style={s.samitiId}>ID #{item.id}</Text>
            </View>
            <View style={s.codeBadge}>
              <Text style={s.codeText}>{item.code_4digit}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No samitis yet. Tap + to add one.</Text>}
      />

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add Samiti</Text>
            <Text style={s.modalSub}>A unique 4-digit code will be auto-generated.</Text>
            <Text style={s.inputLabel}>Samiti Name</Text>
            <TextInput
              style={s.inputField}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Gram Seva Samiti"
              placeholderTextColor={C.textTer}
              autoFocus
            />
            <TouchableOpacity style={[s.primaryBtn, saving && { opacity: 0.7 }]} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>Add Samiti</Text>}
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
  iconBox:       { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  samitiName:    { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  samitiId:      { color: C.textSec, fontSize: 12, marginTop: 2 },
  codeBadge:     { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  codeText:      { color: '#fff', fontWeight: '700', fontSize: 17, letterSpacing: 2 },
  empty:         { textAlign: 'center', color: C.textSec, marginTop: 80, fontSize: 15 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:    { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4, letterSpacing: -0.3 },
  modalSub:      { color: C.textSec, fontSize: 13, marginBottom: 20 },
  inputLabel:    { color: C.textSec, fontSize: 12, marginBottom: 6, letterSpacing: 0.1 },
  inputField:    { backgroundColor: C.surfaceVar, borderRadius: 10, color: '#fff', fontSize: 15, paddingHorizontal: 14, height: 46, marginBottom: 20 },
  primaryBtn:    { backgroundColor: C.primary, borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  primaryBtnText:{ color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  ghostBtn:      { height: 44, justifyContent: 'center', alignItems: 'center' },
  ghostBtnText:  { color: C.primary, fontSize: 15, fontWeight: '500' },
});
