import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, ScrollView, RefreshControl,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface Product {
  id: number; name: string; description: string | null;
  price: string; unit: string; is_available: boolean;
}
interface CartItem extends Product { quantity: number; }

export default function DistributorShopScreen() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [placing, setPlacing]         = useState(false);
  const [notes, setNotes]             = useState('');
  const [blocked, setBlocked]         = useState(false);
  const [overdueInfo, setOverdueInfo] = useState<{ id: number; total_amount: string; due_date: string } | null>(null);
  const [snackMsg, setSnackMsg]       = useState('');
  const [snackError, setSnackError]   = useState(false);

  const checkBalance = useCallback(async () => {
    try {
      const res = await api.get('/orders/pending-balance');
      setBlocked(res.data.blocked);
      setOverdueInfo(res.data.overdueOrder || null);
    } catch { /* silent */ }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.filter((p: Product) => p.is_available));
    } catch {
      setSnackError(true); setSnackMsg('Failed to load products');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    fetchProducts();
    checkBalance();
  }, [fetchProducts, checkBalance]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) return prev.map(c => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter(c => c.id !== productId);
      return prev.map(c => c.id === productId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const cartQty = (productId: number) => cart.find(c => c.id === productId)?.quantity ?? 0;
  const cartTotal = cart.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const items = cart.map(c => ({ product_id: c.id, quantity: c.quantity }));
      await api.post('/orders', { items, notes: notes.trim() || undefined });
      setCart([]);
      setNotes('');
      setCartVisible(false);
      setSnackError(false);
      setSnackMsg('✅ Order placed! Payment due within 24 hours.');
      checkBalance();
    } catch (e: any) {
      setSnackError(true);
      setSnackMsg(e.response?.data?.error || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
  );

  return (
    <View style={s.screen}>

      {/* Overdue Payment Banner */}
      {blocked && overdueInfo && (
        <View style={s.overdueBar}>
          <MaterialCommunityIcons name="alert-circle" size={16} color={C.error} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.overdueTitle}>Payment Overdue — Orders Blocked.</Text>
            <Text style={s.overdueSub}>
              ₹{parseFloat(overdueInfo.total_amount).toFixed(2)} due from {overdueInfo.due_date}. Contact admin.
            </Text>
          </View>
        </View>
      )}

      {/* Product Grid */}
      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} tintColor={C.primary} />}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <Text style={s.listTitle}>Available Products</Text>
            <View style={s.countBadge}><Text style={s.countText}>{products.length}</Text></View>
          </View>
        }
        renderItem={({ item }) => {
          const qty = cartQty(item.id);
          return (
            <View style={s.productCard}>
              <View style={s.productIconBox}>
                <Text style={{ fontSize: 24 }}>🧴</Text>
              </View>
              <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
              {item.description ? <Text style={s.productDesc} numberOfLines={2}>{item.description}</Text> : null}
              <Text style={s.productPrice}>₹{parseFloat(item.price).toFixed(2)}<Text style={s.productUnit}>/{item.unit}</Text></Text>

              {blocked ? (
                <View style={[s.addBtn, { backgroundColor: '#3a1212' }]}>
                  <Text style={{ color: C.error, fontSize: 13, fontWeight: '600' }}>Blocked</Text>
                </View>
              ) : qty === 0 ? (
                <TouchableOpacity style={s.addBtn} onPress={() => addToCart(item)}>
                  <Text style={s.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.qtyRow}>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => removeFromCart(item.id)}>
                    <Text style={s.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.qtyNum}>{qty}</Text>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => addToCart(item)}>
                    <Text style={s.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>No products available right now.</Text>}
      />

      {/* Floating Cart Button */}
      {cartCount > 0 && !blocked && (
        <TouchableOpacity style={s.cartFab} onPress={() => setCartVisible(true)}>
          <View style={s.cartFabLeft}>
            <MaterialCommunityIcons name="cart" size={20} color="#fff" />
            <Text style={s.cartFabText}>View Cart ({cartCount})</Text>
          </View>
          <Text style={s.cartFabTotal}>₹{cartTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={cartVisible} animationType="slide" transparent onRequestClose={() => setCartVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Your Cart</Text>
              <TouchableOpacity onPress={() => setCartVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textSec} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {cart.map(item => (
                <View key={item.id} style={s.cartItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cartItemName}>{item.name}</Text>
                    <Text style={s.cartItemSub}>{item.quantity} {item.unit} × ₹{parseFloat(item.price).toFixed(2)}</Text>
                  </View>
                  <Text style={s.cartItemTotal}>₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>
            
            {/* Soft background shift for totals section instead of line divider */}
            <View style={s.summaryContainer}>
               <View style={s.cartTotalRow}>
                 <Text style={s.cartTotalLabel}>Total</Text>
                 <Text style={s.cartTotalValue}>₹{cartTotal.toFixed(2)}</Text>
               </View>
               <TextInput
                 style={s.notesInput}
                 value={notes}
                 onChangeText={setNotes}
                 placeholder="Special instructions (optional)..."
                 placeholderTextColor={C.textTer}
                 multiline
               />
            </View>
            
            <View style={s.dueBanner}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={C.morning} />
              <Text style={s.dueText}>  Payment due within 24 hours of ordering</Text>
            </View>
            <TouchableOpacity
              style={[s.primaryBtn, placing && { opacity: 0.7 }]}
              onPress={handlePlaceOrder} disabled={placing}
            >
              {placing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.primaryBtnText}>Confirm Order</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={!!snackMsg} onDismiss={() => setSnackMsg('')} duration={3500}
        style={{ backgroundColor: snackError ? '#3a1212' : '#0d2a0d', margin: 16, borderRadius: 12 }}
      >
        <Text style={{ color: snackError ? C.error : C.success }}>{snackMsg}</Text>
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: C.bg },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  overdueBar:    { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#3a1212', marginHorizontal: 16, marginTop: 12, borderRadius: 10, padding: 14 },
  overdueTitle:  { color: C.error, fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  overdueSub:    { color: 'rgba(255,100,100,0.8)', fontSize: 12, marginTop: 4, letterSpacing: -0.1 },
  listHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 },
  listTitle:     { color: '#fff', fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  countBadge:    { backgroundColor: C.surfaceVar, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  countText:     { color: '#fff', fontSize: 12, fontWeight: '600' },
  productCard:   { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 14 },
  productIconBox:{ width: 48, height: 48, borderRadius: 12, backgroundColor: C.surfaceVar, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  productName:   { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: -0.2, marginBottom: 4 },
  productDesc:   { color: '#6B6B70', fontSize: 11, marginBottom: 8 },
  productPrice:  { color: C.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: -0.2 },
  productUnit:   { color: C.textSec, fontSize: 12, fontWeight: '400' },
  addBtn:        { backgroundColor: C.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  addBtnText:    { color: '#fff', fontSize: 13, fontWeight: '600' },
  qtyRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surfaceVar, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  qtyBtn:        { width: 26, height: 26, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText:    { color: '#fff', fontSize: 18, fontWeight: '500' },
  qtyNum:        { color: '#fff', fontSize: 14, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  cartFab:       { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: C.primary, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 18, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  cartFabLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartFabText:   { color: '#fff', fontSize: 15, fontWeight: '600' },
  cartFabTotal:  { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(19,19,19,0.85)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: '#1c1c1e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:    { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  cartItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  cartItemName:  { color: '#fff', fontSize: 14, fontWeight: '600' },
  cartItemSub:   { color: C.textSec, fontSize: 12, marginTop: 4 },
  cartItemTotal: { color: C.primary, fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  summaryContainer:{ backgroundColor: C.surface, borderRadius: 16, padding: 16, marginTop: 12, marginBottom: 16 },
  cartTotalRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cartTotalLabel:{ color: C.textSec, fontSize: 15 },
  cartTotalValue:{ color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  notesInput:    { backgroundColor: C.surfaceVar, borderRadius: 10, color: '#fff', fontSize: 14, paddingHorizontal: 14, paddingVertical: 12, minHeight: 60 },
  dueBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a1f0a', borderRadius: 8, padding: 10, marginBottom: 16 },
  dueText:       { color: C.morning, fontSize: 12, fontWeight: '500' },
  primaryBtn:    { backgroundColor: C.primary, borderRadius: 10, height: 50, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText:{ color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  empty:         { textAlign: 'center', color: C.textSec, marginTop: 80, fontSize: 15 },
});
