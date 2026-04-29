import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Modal,
  StyleSheet, ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface Product { id: number; name: string; description: string; price: string; unit: string; is_available: boolean; }
interface CartItem { product: Product; qty: number; }

const CATEGORIES = [
  { label: '🥛 Milk', key: 'milk' },
  { label: '🧈 Ghee', key: 'ghee' },
  { label: '🫙 Paneer', key: 'paneer' },
  { label: '🥣 Others', key: 'other' },
];

export default function DistributorShopScreen() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [cart, setCart]             = useState<CartItem[]>([]);
  const [blocked, setBlocked]       = useState(false);
  const [modalVisible, setModal]    = useState(false);
  const [notes, setNotes]           = useState('');
  const [placing, setPlacing]       = useState(false);
  const [snackMsg, setSnackMsg]     = useState('');
  const [snackError, setSnackError] = useState(false);
  const [selCat, setSelCat]         = useState('milk');

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data.filter((p: Product) => p.is_available))).catch(() => {}).finally(() => setLoading(false));
    api.get('/orders/pending-balance').then(r => setBlocked(r.data.blocked)).catch(() => {});
  }, []);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === p.id);
      if (existing) return prev.map(c => c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product: p, qty: 1 }];
    });
  };

  const removeFromCart = (pid: number) => setCart(prev => {
    const ex = prev.find(c => c.product.id === pid);
    if (!ex) return prev;
    if (ex.qty === 1) return prev.filter(c => c.product.id !== pid);
    return prev.map(c => c.product.id === pid ? { ...c, qty: c.qty - 1 } : c);
  });

  const cartTotal = cart.reduce((a, c) => a + parseFloat(c.product.price) * c.qty, 0);
  const cartQty   = (pid: number) => cart.find(c => c.product.id === pid)?.qty || 0;

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      await api.post('/orders', { items: cart.map(c => ({ product_id: c.product.id, quantity: c.qty })), notes: notes || undefined });
      setSnackError(false); setSnackMsg('✅ Order placed successfully!');
      setCart([]); setNotes(''); setModal(false);
    } catch (e: any) {
      setSnackError(true); setSnackMsg(e.response?.data?.error || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  const filtered = products.filter(p => {
    const name = p.name.toLowerCase();
    if (selCat === 'milk')   return name.includes('milk') || name.includes('doodh');
    if (selCat === 'ghee')   return name.includes('ghee') || name.includes('butter');
    if (selCat === 'paneer') return name.includes('paneer') || name.includes('cheese') || name.includes('curd') || name.includes('yogurt');
    return true;
  });

  if (loading) return <View style={s.center}><ActivityIndicator color={C.purple} size="large" /></View>;

  return (
    <View style={s.screen}>
      {blocked && (
        <View style={s.blockedBanner}>
          <Text style={s.blockedTxt}>⚠️  You have an overdue payment. Please clear balance to place new orders.</Text>
        </View>
      )}

      {/* ── Category pills ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.key} style={[s.catChip, selCat === cat.key && s.catChipActive]} onPress={() => setSelCat(cat.key)}>
            <Text style={[s.catTxt, selCat === cat.key && s.catTxtActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Products grid ── */}
      <FlatList
        data={filtered.length > 0 ? filtered : products}
        keyExtractor={i => String(i.id)}
        numColumns={2}
        contentContainerStyle={s.grid}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => {
          const inCart = cartQty(item.id);
          return (
            <View style={s.productCard}>
              <View style={s.productImg}>
                <Text style={{ fontSize: 36 }}>
                  {item.name.toLowerCase().includes('milk') ? '🥛' : item.name.toLowerCase().includes('ghee') ? '🧈' : item.name.toLowerCase().includes('paneer') ? '🫙' : '🍶'}
                </Text>
              </View>
              <Text style={s.productName}>{item.name}</Text>
              <Text style={s.productUnit}>{item.unit}</Text>
              <Text style={s.productPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>

              {inCart === 0 ? (
                <TouchableOpacity style={[s.addBtn, blocked && { opacity: 0.4 }]} onPress={() => !blocked && addToCart(item)} disabled={blocked}>
                  <Text style={s.addBtnTxt}>+ Add</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.qtyRow}>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => removeFromCart(item.id)}>
                    <Text style={s.qtyBtnTxt}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.qtyVal}>{inCart}</Text>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => addToCart(item)}>
                    <Text style={s.qtyBtnTxt}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>No products available.</Text>}
      />

      {/* ── Floating cart bar ── */}
      {cart.length > 0 && (
        <TouchableOpacity style={s.cartBar} onPress={() => setModal(true)}>
          <View style={s.cartBadge}><Text style={s.cartBadgeTxt}>{cart.reduce((a, c) => a + c.qty, 0)}</Text></View>
          <Text style={s.cartBarTxt}>View Cart</Text>
          <Text style={s.cartBarTotal}>₹{cartTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      {/* ── Cart / Checkout modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={s.modalBg}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Your Cart</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {cart.map(c => (
                <View key={c.product.id} style={s.cartRow}>
                  <Text style={s.cartName}>{c.product.name}</Text>
                  <View style={s.qtyRow}>
                    <TouchableOpacity style={s.qtyBtn} onPress={() => removeFromCart(c.product.id)}><Text style={s.qtyBtnTxt}>−</Text></TouchableOpacity>
                    <Text style={s.qtyVal}>{c.qty}</Text>
                    <TouchableOpacity style={s.qtyBtn} onPress={() => addToCart(c.product)}><Text style={s.qtyBtnTxt}>+</Text></TouchableOpacity>
                  </View>
                  <Text style={s.cartItemTotal}>₹{(parseFloat(c.product.price) * c.qty).toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={s.divider} />
            <View style={s.totalRow}>
              <Text style={s.totalLbl}>Total</Text>
              <Text style={s.totalVal}>₹{cartTotal.toFixed(2)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLbl}>Due by</Text>
              <Text style={s.dueTxt}>{new Date(Date.now() + 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
            </View>

            <TextInput style={s.notesInput} value={notes} onChangeText={setNotes} placeholder="Notes (optional)" placeholderTextColor={C.textTer} multiline />

            <TouchableOpacity style={[s.placeBtn, placing && { opacity: 0.6 }]} onPress={placeOrder} disabled={placing}>
              {placing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.placeBtnTxt}>Place Order</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)} style={{ alignItems: 'center', paddingTop: 12 }}>
              <Text style={{ color: C.textSec, fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Snackbar visible={!!snackMsg} onDismiss={() => setSnackMsg('')} duration={3500}
        style={{ backgroundColor: snackError ? C.errorBg : C.successBg, margin: 16, borderRadius: 12 }}>
        <Text style={{ color: snackError ? C.error : C.success, fontWeight: '500' }}>{snackMsg}</Text>
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: C.bg },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  blockedBanner:  { backgroundColor: C.warningBg, padding: 14, borderBottomWidth: 1, borderBottomColor: '#FFCC80' },
  blockedTxt:     { color: C.warning, fontSize: 13, fontWeight: '500' },

  catRow:         { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catChip:        { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: C.surface, borderRadius: 100 },
  catChipActive:  { backgroundColor: C.purple },
  catTxt:         { fontSize: 13, fontWeight: '600', color: C.textSec },
  catTxtActive:   { color: '#fff' },

  grid:           { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  productCard:    { flex: 1, backgroundColor: C.white, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  productImg:     { width: 60, height: 60, borderRadius: 16, backgroundColor: C.surfaceLow, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  productName:    { fontSize: 14, fontWeight: '700', color: C.textPri, marginBottom: 2 },
  productUnit:    { fontSize: 11, color: C.textSec, marginBottom: 6 },
  productPrice:   { fontSize: 16, fontWeight: '800', color: C.purple, marginBottom: 10 },
  addBtn:         { backgroundColor: C.purple, borderRadius: 100, paddingVertical: 8, alignItems: 'center' },
  addBtnTxt:      { color: '#fff', fontSize: 13, fontWeight: '700' },
  qtyRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.inputFill, borderRadius: 100, padding: 4 },
  qtyBtn:         { width: 30, height: 30, borderRadius: 100, backgroundColor: C.purple, justifyContent: 'center', alignItems: 'center' },
  qtyBtnTxt:      { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 18 },
  qtyVal:         { fontSize: 14, fontWeight: '700', color: C.textPri },
  empty:          { textAlign: 'center', color: C.textSec, padding: 32, fontSize: 14 },

  cartBar:        { position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: C.purple, borderRadius: 18, height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, shadowColor: C.purple, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 20, elevation: 10 },
  cartBadge:      { backgroundColor: '#fff', borderRadius: 100, width: 26, height: 26, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cartBadgeTxt:   { color: C.purple, fontSize: 12, fontWeight: '800' },
  cartBarTxt:     { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700' },
  cartBarTotal:   { color: '#fff', fontSize: 16, fontWeight: '800' },

  modalBg:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle:    { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle:     { fontSize: 20, fontWeight: '800', color: C.textPri, marginBottom: 16 },
  cartRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cartName:       { flex: 1, fontSize: 14, fontWeight: '600', color: C.textPri },
  cartItemTotal:  { fontSize: 14, fontWeight: '700', color: C.purple, marginLeft: 12, minWidth: 60, textAlign: 'right' },
  divider:        { height: 1, backgroundColor: C.border, marginVertical: 16 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLbl:       { fontSize: 14, color: C.textSec },
  totalVal:       { fontSize: 20, fontWeight: '800', color: C.textPri },
  dueTxt:         { fontSize: 14, color: C.warning, fontWeight: '600' },
  notesInput:     { backgroundColor: C.inputFill, borderRadius: 14, padding: 14, color: C.textPri, fontSize: 14, marginTop: 12, marginBottom: 16, minHeight: 56 },
  placeBtn:       { height: 56, backgroundColor: C.purple, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: C.purple, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6 },
  placeBtnTxt:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
