import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, ScrollView, RefreshControl,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface Order {
  id: number; total_amount: string; status: 'pending' | 'paid' | 'overdue';
  due_date: string; paid_at: string | null; notes: string | null; created_at: string;
}
interface OrderItem {
  id: number; product_name: string; unit: string;
  quantity: string; unit_price: string; subtotal: string;
}

const STATUS_CONFIG = {
  pending: { color: C.morning,   bg: '#2a1f0a', label: 'Pending', icon: 'clock-outline'     as const },
  paid:    { color: C.success,   bg: '#0a2a0d', label: 'Paid',    icon: 'check-circle-outline' as const },
  overdue: { color: C.error,     bg: '#3a1212', label: 'Overdue', icon: 'alert-circle-outline' as const },
};

export default function DistributorOrdersScreen() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]     = useState<Order | null>(null);
  const [items, setItems]           = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
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

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
  );

  const overdueCount = orders.filter(o => o.status === 'overdue').length;

  return (
    <View style={s.screen}>
      {overdueCount > 0 && (
        <View style={s.overdueBar}>
          <MaterialCommunityIcons name="alert-circle" size={16} color={C.error} />
          <Text style={s.overdueText}>  {overdueCount} overdue order{overdueCount > 1 ? 's' : ''} — contact admin for payment</Text>
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={C.primary} />}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <Text style={s.listTitle}>My Orders</Text>
            <View style={s.countBadge}><Text style={s.countText}>{orders.length}</Text></View>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <TouchableOpacity style={s.card} onPress={() => openOrder(item)}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Text style={s.orderId}>Order #{item.id}</Text>
                  <View style={[s.statusChip, { backgroundColor: cfg.bg }]}>
                    <MaterialCommunityIcons name={cfg.icon} size={12} color={cfg.color} />
                    <Text style={[s.statusText, { color: cfg.color }]}> {cfg.label}</Text>
                  </View>
                </View>
                <Text style={s.orderDate}>{formatDate(item.created_at)}</Text>
                {item.status === 'pending' || item.status === 'overdue' ? (
                  <Text style={[s.orderDue, item.status === 'overdue' && { color: C.error }]}>Due: {item.due_date}</Text>
                ) : null}
                {item.paid_at && <Text style={s.orderPaid}>Paid: {formatDate(item.paid_at)}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                <Text style={s.orderAmount}>₹{parseFloat(item.total_amount).toFixed(2)}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textTer} style={{ marginTop: 2 }} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>No orders yet. Start shopping!</Text>}
      />

      {/* Order Detail Modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Order #{selected?.id}</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textSec} />
              </TouchableOpacity>
            </View>

            {selected && (() => {
              const cfg = STATUS_CONFIG[selected.status];
              return (
                <View style={[s.statusFullChip, { backgroundColor: cfg.bg }]}>
                  <MaterialCommunityIcons name={cfg.icon} size={16} color={cfg.color} />
                  <Text style={[s.statusFullText, { color: cfg.color }]}>
                    {cfg.label} {selected.status !== 'paid' ? `— Due ${selected.due_date}` : ''}
                  </Text>
                </View>
              );
            })()}

            {loadingItems
              ? <ActivityIndicator color={C.primary} style={{ marginVertical: 30 }} />
              : (
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
              )
            }

            <View style={s.summaryBox}>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total</Text>
                <Text style={s.totalValue}>₹{parseFloat(selected?.total_amount || '0').toFixed(2)}</Text>
              </View>
              {selected?.notes && <Text style={s.notesText}>Note: {selected.notes}</Text>}
            </View>
            
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
  overdueBar:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3a1212', marginHorizontal: 16, marginTop: 12, borderRadius: 10, padding: 12 },
  overdueText:    { color: C.error, fontSize: 12, fontWeight: '600' },
  listHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
  listTitle:      { color: '#fff', fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  countBadge:     { backgroundColor: C.surfaceVar, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  countText:      { color: '#fff', fontSize: 12, fontWeight: '600' },
  card:           { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  orderId:        { color: '#fff', fontSize: 14, fontWeight: '700' },
  statusChip:     { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:     { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  orderDate:      { color: '#6B6B70', fontSize: 12, marginBottom: 4 },
  orderDue:       { color: C.morning, fontSize: 11 },
  orderPaid:      { color: C.success, fontSize: 11 },
  orderAmount:    { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  empty:          { textAlign: 'center', color: C.textSec, marginTop: 80, fontSize: 15 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(19,19,19,0.85)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: '#1c1c1e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:     { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  statusFullChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 16 },
  statusFullText: { fontSize: 13, fontWeight: '600', marginLeft: 8 },
  itemRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemName:       { color: '#fff', fontSize: 14, fontWeight: '600' },
  itemSub:        { color: C.textSec, fontSize: 12, marginTop: 4 },
  itemTotal:      { color: C.primary, fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  summaryBox:     { backgroundColor: C.surface, borderRadius: 16, padding: 16 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:     { color: C.textSec, fontSize: 15 },
  totalValue:     { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  notesText:      { color: C.textSec, fontSize: 12, marginTop: 12 },
});
