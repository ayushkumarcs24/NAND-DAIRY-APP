import React, { useEffect, useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl,
  Text, TextInput, TouchableOpacity, Modal,
  ActivityIndicator, Switch, Alert,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface User {
  id: number; name: string; mobile_number: string;
  role: string; is_active: boolean;
}

const ROLES = [
  { value: 'milk-entry', label: 'Milk Entry' },
  { value: 'fat-snf', label: 'Fat/SNF' },
  { value: 'report', label: 'Report' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: '#FF3B30', 'milk-entry': C.primary, 'fat-snf': C.success, report: '#BF5AF2', distributor: '#FF9500'
};

const AVATAR_COLORS = ['#0071e3', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#BF5AF2'];

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AccountantsScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackErr, setSnackErr] = useState(false);
  const [form, setForm] = useState({ name: '', mobile_number: '', password: '', role: 'milk-entry' });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch { setSnackErr(true); setSnackMsg('Failed to load accountants'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAdd = async () => {
    if (!form.name || !form.mobile_number || !form.password) {
      setSnackErr(true); setSnackMsg('All fields are required'); return;
    }
    try {
      setSaving(true);
      await api.post('/users', form);
      setVisible(false);
      setForm({ name: '', mobile_number: '', password: '', role: 'milk-entry' });
      setSnackErr(false); setSnackMsg('Accountant added!');
      fetchUsers();
    } catch (e: any) {
      setSnackErr(true); setSnackMsg(e.response?.data?.error || 'Failed to add accountant');
    } finally { setSaving(false); }
  };

  const toggleActive = async (id: number, current: boolean) => {
    try {
      await api.patch(`/users/${id}/toggle-active`, { is_active: !current });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !current } : u));
    } catch { setSnackErr(true); setSnackMsg('Failed to update status'); }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Delete Accountant',
      `Are you sure you want to completely delete ${name}? This action cannot be undone and will permanently remove them from the system.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/users/${id}`);
              setSnackErr(false);
              setSnackMsg('User successfully deleted');
              fetchUsers();
            } catch {
              setLoading(false);
              setSnackErr(true);
              setSnackMsg('Failed to delete user');
            }
          }
        }
      ]
    );
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
  );

  return (
    <View style={s.screen}>
      <FlatList
        data={users}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor={C.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.listTitle}>Accountants</Text>
              <View style={s.countBadge}><Text style={s.countText}>{users.length}</Text></View>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={() => setVisible(true)}>
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={s.card}>
            <View style={[s.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
              <Text style={s.avatarText}>{initials(item.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName}>{item.name}</Text>
              <Text style={s.userMobile}>📱 {item.mobile_number}</Text>
              <View style={[s.rolePill, { backgroundColor: ROLE_COLORS[item.role] + '22' }]}>
                <Text style={[s.roleText, { color: ROLE_COLORS[item.role] }]}>{item.role}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Switch
                value={item.is_active}
                onValueChange={() => toggleActive(item.id, item.is_active)}
                trackColor={{ false: '#333', true: C.primary + '80' }}
                thumbColor={item.is_active ? C.primary : '#555'}
              />
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="delete-outline" size={24} color={C.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No accountants yet. Tap + to add one.</Text>}
      />

      {/* Add Modal */}
      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add Accountant</Text>

            <Text style={s.inputLabel}>Full Name</Text>
            <TextInput style={s.inputField} value={form.name} onChangeText={t => setForm(p => ({ ...p, name: t }))} placeholder="Ramesh Kumar" placeholderTextColor={C.textTer} />

            <Text style={s.inputLabel}>Mobile Number</Text>
            <TextInput style={s.inputField} value={form.mobile_number} onChangeText={t => setForm(p => ({ ...p, mobile_number: t }))} keyboardType="numeric" maxLength={10} placeholder="10-digit number" placeholderTextColor={C.textTer} />

            <Text style={s.inputLabel}>Password</Text>
            <TextInput style={s.inputField} value={form.password} onChangeText={t => setForm(p => ({ ...p, password: t }))} secureTextEntry placeholder="Set password" placeholderTextColor={C.textTer} />

            <Text style={s.inputLabel}>Role</Text>
            <View style={s.roleGrid}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[s.roleChip, form.role === r.value && s.roleChipActive]}
                  onPress={() => setForm(p => ({ ...p, role: r.value }))}
                >
                  <Text style={[s.roleChipText, form.role === r.value && s.roleChipTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[s.primaryBtn, saving && { opacity: 0.7 }]} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>Add Accountant</Text>}
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
  listTitle:     { fontSize: 22, fontWeight: '700', color: C.textPri, letterSpacing: -0.3 },
  countBadge:    { backgroundColor: C.surfaceVar, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText:     { color: C.textPri, fontSize: 12, fontWeight: '600' },
  addBtn:        { backgroundColor: C.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  addBtnText:    { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 26 },
  card:          { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  avatar:        { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText:    { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: -0.2 },
  userName:      { color: C.textPri, fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  userMobile:    { color: C.textSec, fontSize: 12, marginTop: 2 },
  rolePill:      { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  roleText:      { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
  empty:         { textAlign: 'center', color: C.textSec, marginTop: 80, fontSize: 15 },
  // Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:    { color: C.textPri, fontSize: 20, fontWeight: '700', marginBottom: 20, letterSpacing: -0.3 },
  inputLabel:    { color: C.textSec, fontSize: 12, marginBottom: 6, letterSpacing: 0.1 },
  inputField:    { backgroundColor: C.inputFill, borderRadius: 10, color: C.textPri, fontSize: 15, paddingHorizontal: 14, height: 46, marginBottom: 14 },
  roleGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  roleChip:      { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.inputFill, borderRadius: 10 },
  roleChipActive:{ backgroundColor: C.primary },
  roleChipText:  { color: C.textSec, fontSize: 13, fontWeight: '500' },
  roleChipTextActive: { color: '#fff' },
  primaryBtn:    { backgroundColor: C.primary, borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  primaryBtnText:{ color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  ghostBtn:      { height: 44, justifyContent: 'center', alignItems: 'center' },
  ghostBtnText:  { color: C.primary, fontSize: 15, fontWeight: '500' },
});
