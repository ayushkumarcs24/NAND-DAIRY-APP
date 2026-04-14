import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, ScrollView, RefreshControl, Alert
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface Order {
  id: number; total_amount: string; status: 'pending' | 'paid' | 'overdue';
  due_date: string; paid_at: string | null; notes: string | null; created_at: string;
  distributor_name?: string; distributor_mobile?: string;
}
interface OrderItem {
  id: number; product_name: string; unit: string;
  quantity: string; unit_price: string; subtotal: string;
}

const STATUS_CONFIG = {
  pending: { color: C.morning,   bg: '#2a1f0a', label: 'Pending' },
  paid:    { color: C.success,   bg: '#0a2a0d', label: 'Paid'    },
  overdue: { color: C.error,     bg: '#3a1212', label: 'Overdue' },
};

export default function AdminDistributorOrdersScreen() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]     = useState<Order | null>(null);
  const [items, setItems]           = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [snackMsg, setSnackMsg]     = useState('');
  const [snackError, setSnackError] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch {
      setSnackError(true); setSnackMsg('Failed to load orders');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openOrder = async (order: Order) => {
    setSelected(order);
    setLoadingItems(true);
    try {
      const res = await api.get(`/orders/${order.id}/items`);
      setItems(res.data);
    } catch {
      setItems([]);
    } finally { setLoadingItems(false); }
  };

  const handleMarkPaid = async (orderId: number) => {
    Alert.alert('Mark as Paid', 'Set this order payment to Paid?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Mark Paid', style: 'default', onPress: async () => {
          setMarkingPaid(true);
          try {
            await api.patch(`/orders/${orderId}/pay`);
            setSnackError(false); setSnackMsg('Order marked as paid');
            if (selected && selected.id === orderId) setSelected(null);
            fetchOrders();
          } catch {
            setSnackError(true); setSnackMsg('Failed to mark paid');
          } finally { setMarkingPaid(false); }
        }
      }
    ]);
  };

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>;

  return (
    <View style={s.screen}>
      <FlatList
        data={orders}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={C.primary} />}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <Text style={s.listTitle}>Distributor Orders</Text>
            <View style={s.countBadge}><Text style={s.countText}>{orders.length}</Text></View>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <TouchableOpacity style={s.card} onPress={() => openOrder(item)}>
              <View style={s.cardTop}>
                <View>
                  <Text style={s.orderId}>Order #{item.id}</Text>
                  <Text style={s.distName}>{item.distributor_name}</Text>
                </View>
                <View style={[s.statusChip, { backgroundColor: cfg.bg }]}>
                  <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              <View style={s.cardMid}>
                <View style={s.midBlock}>
                  <Text style={s.midLabel}>Total Amount</Text>
                  <Text style={s.midValue}>₹{parseFloat(item.total_amount).toFixed(2)}</Text>
                </View>
                <View style={s.midBlock}>
                  <Text style={s.midLabel}>Due Date</Text>
                  <Text style={[s.midValue, item.status === 'overdue' && { color: C.error }]}>{item.due_date}</Text>
                </View>
              </View>

              {item.status !== 'paid' && (
                <View style={s.cardAction}>
                  <TouchableOpacity style={s.payBtn} onPress={() => handleMarkPaid(item.id)} disabled={markingPaid}>
                    <Text style={s.payBtnText}>Mark as Paid</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>No distributor orders yet.</Text>}
      />

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Order #{selected?.id}</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textSec} />
              </TouchableOpacity>
            </View>

            {loadingItems ? <ActivityIndicator color={C.primary} style={{ marginVertical: 30 }} /> : (
              <ScrollView style={{ maxHeight: 300, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
                {items.map(item => (
                  <View key={item.id} style={s.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{item.product_name}</Text>
                      <Text style={s.itemSub}>{parseFloat(item.quantity).toFixed(2)} {item.unit} × ₹{parseFloat(item.unit_price).toFixed(2)}</Text>
                    </View>
                    <Text style={s.itemTotal}>₹{parseFloat(item.subtotal).toFixed(2)}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={s.summaryBox}>
               <View style={s.totalRow}>
                 <Text style={s.totalLabel}>Total</Text>
                 <Text style={s.totalValue}>₹{parseFloat(selected?.total_amount || '0').toFixed(2)}</Text>
               </View>
               {selected?.notes && <Text style={s.notesText}>Distributor Note: {selected.notes}</Text>}
            </View>

            {selected?.status !== 'paid' && (
              <TouchableOpacity style={s.primaryBtn} onPress={() => handleMarkPaid(selected!.id)} disabled={markingPaid}>
                <Text style={s.primaryBtnText}>Mark Order as Paid</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={!!snackMsg} onDismiss={() => setSnackMsg('')} duration={3000}
        style={{ backgroundColor: snackError ? '#3a1212' : '#0d2a0d', margin: 16, borderRadius: 12 }}
      >
        <Text style={{ color: snackError ? C.error : C.success }}>{snackMsg}</Text>
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: C.bg },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  listHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  listTitle:      { color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  countBadge:     { backgroundColor: C.surfaceVar, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  countText:      { color: '#fff', fontSize: 13, fontWeight: '600' },
  card:           { backgroundColor: C.surface, borderRadius: 16, padding: 16 },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  orderId:        { color: C.textSec, fontSize: 13, marginBottom: 2 },
  distName:       { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  statusChip:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:     { fontSize: 12, fontWeight: '600' },
  cardMid:        { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 12, padding: 12, marginBottom: 12 },
  midBlock:       { flex: 1 },
  midLabel:       { color: C.textSec, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  midValue:       { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardAction:     { borderTopWidth: 1, borderTopColor: C.surfaceVar, paddingTop: 12 },
  payBtn:         { backgroundColor: C.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  payBtnText:     { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(19,19,19,0.85)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: '#1c1c1e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:     { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  itemRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.surfaceVar },
  itemName:       { color: '#fff', fontSize: 14, fontWeight: '600' },
  itemSub:        { color: C.textSec, fontSize: 12, marginTop: 4 },
  itemTotal:      { color: C.primary, fontSize: 14, fontWeight: '700' },
  summaryBox:     { backgroundColor: C.surfaceVar, borderRadius: 16, padding: 16, marginBottom: 16 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:     { color: C.textSec, fontSize: 15 },
  totalValue:     { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  notesText:      { color: C.morning, fontSize: 12, marginTop: 12 },
  primaryBtn:     { backgroundColor: C.primary, borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty:          { textAlign: 'center', color: C.textSec, marginTop: 80, fontSize: 15 },
});
