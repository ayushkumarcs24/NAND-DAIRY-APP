import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import {
  Text, FAB, Modal, Portal, TextInput, Button,
  Card, Switch, Chip, Snackbar, ActivityIndicator, SegmentedButtons,
} from 'react-native-paper';
import api from '../../services/api';
import { DairyTheme } from '../../constants/Theme';

interface User {
  id: number; name: string; mobile_number: string;
  role: string; is_active: boolean;
}

const ROLES = [
  { value: 'milk-entry', label: 'Milk Entry' },
  { value: 'fat-snf', label: 'Fat/SNF' },
  { value: 'report', label: 'Report' },
  { value: 'admin', label: 'Admin' },
];

export default function AccountantsScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [form, setForm] = useState({ name: '', mobile_number: '', password: '', role: 'milk-entry' });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch { setSnackMsg('Failed to load accountants'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAdd = async () => {
    if (!form.name || !form.mobile_number || !form.password) {
      setSnackMsg('All fields are required'); return;
    }
    try {
      setSaving(true);
      await api.post('/users', form);
      setVisible(false);
      setForm({ name: '', mobile_number: '', password: '', role: 'milk-entry' });
      setSnackMsg('Accountant added successfully!');
      fetchUsers();
    } catch (e: any) {
      setSnackMsg(e.response?.data?.error || 'Failed to add accountant');
    } finally { setSaving(false); }
  };

  const toggleActive = async (id: number, current: boolean) => {
    try {
      await api.patch(`/users/${id}/toggle-active`, { is_active: !current });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !current } : u));
    } catch { setSnackMsg('Failed to update status'); }
  };

  const roleColor: Record<string, string> = {
    admin: '#D32F2F', 'milk-entry': '#1976D2', 'fat-snf': '#388E3C', report: '#7B1FA2',
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={DairyTheme.colors.primary} /></View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.name}</Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>📱 {item.mobile_number}</Text>
                <Chip
                  compact
                  style={{ backgroundColor: roleColor[item.role] || '#999', marginTop: 6, alignSelf: 'flex-start' }}
                  textStyle={{ color: '#fff', fontSize: 11 }}
                >
                  {item.role}
                </Chip>
              </View>
              <Switch value={item.is_active} onValueChange={() => toggleActive(item.id, item.is_active)} color={DairyTheme.colors.primary} />
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No accountants yet. Tap + to add one.</Text>}
      />

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.modalTitle}>Add Accountant</Text>
          <TextInput label="Full Name" mode="outlined" value={form.name} onChangeText={t => setForm(p => ({ ...p, name: t }))} style={styles.input} />
          <TextInput label="Mobile Number" mode="outlined" value={form.mobile_number} onChangeText={t => setForm(p => ({ ...p, mobile_number: t }))} keyboardType="numeric" maxLength={10} style={styles.input} />
          <TextInput label="Password" mode="outlined" value={form.password} onChangeText={t => setForm(p => ({ ...p, password: t }))} secureTextEntry style={styles.input} />
          <Text variant="labelLarge" style={{ marginBottom: 8 }}>Role</Text>
          <SegmentedButtons
            value={form.role}
            onValueChange={v => setForm(p => ({ ...p, role: v }))}
            buttons={ROLES.map(r => ({ value: r.value, label: r.label }))}
            style={{ marginBottom: 16 }}
          />
          <Button mode="contained" onPress={handleAdd} loading={saving} disabled={saving}>Add Accountant</Button>
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
});
