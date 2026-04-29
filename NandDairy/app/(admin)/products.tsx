import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, Switch, RefreshControl,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { C } from '../../constants/Theme';

interface Product {
  id: number; name: string; description: string | null;
  price: string; unit: string; is_available: boolean;
}

export default function AdminProductsScreen() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [editingId, setEditingId]     = useState<number | null>(null);

  const [formName, setFormName]       = useState('');
  const [formDesc, setFormDesc]       = useState('');
  const [formPrice, setFormPrice]     = useState('');
  const [formUnit, setFormUnit]       = useState('liter');

  const [snackMsg, setSnackMsg]       = useState('');
  const [snackError, setSnackError]   = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch {
      setSnackError(true); setSnackMsg('Failed to load products');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => {
    setEditingId(null); setFormName(''); setFormDesc(''); setFormPrice(''); setFormUnit('liter');
    setModalVisible(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id); setFormName(p.name); setFormDesc(p.description || '');
    setFormPrice(parseFloat(p.price).toString()); setFormUnit(p.unit);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrice.trim()) { setSnackError(true); setSnackMsg('Name and Price are required'); return; }
    setSaving(true);
    try {
      const payload = { name: formName, description: formDesc, price: parseFloat(formPrice), unit: formUnit };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setSnackMsg('Product updated');
      } else {
        await api.post('/products', payload);
        setSnackMsg('Product created');
      }
      setSnackError(false);
      setModalVisible(false);
      fetchProducts();
    } catch (e: any) {
      setSnackError(true); setSnackMsg(e.response?.data?.error || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      const updated = !product.is_available;
      await api.patch(`/products/${product.id}/toggle`, { is_available: updated });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: updated } : p));
      setSnackError(false); setSnackMsg(`Product marked ${updated ? 'Available' : 'Unavailable'}`);
    } catch {
      setSnackError(true); setSnackMsg('Failed to toggle availability');
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>;

  return (
    <View style={s.screen}>
      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} tintColor={C.primary} />}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.listTitle}>Products</Text>
              <View style={s.countBadge}><Text style={s.countText}>{products.length}</Text></View>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={openAdd}>
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.card, !item.is_available && s.cardDisabled]} onPress={() => openEdit(item)}>
            <View style={s.iconBox}><Text style={{ fontSize: 24 }}>🧴</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.productName}>{item.name}</Text>
              <Text style={s.productPrice}>₹{parseFloat(item.price).toFixed(2)}<Text style={s.productUnit}>/{item.unit}</Text></Text>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              <Switch
                value={item.is_available}
                onValueChange={() => toggleAvailability(item)}
                trackColor={{ false: '#3a1212', true: '#0a2a0d' }}
                thumbColor={item.is_available ? C.success : C.error}
              />
              <Text style={[s.statusText, { color: item.is_available ? C.success : C.textSec }]}>
                {item.is_available ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.empty}>No products available. Add one.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingId ? 'Edit Product' : 'Add Product'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textSec} />
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>Product Name</Text>
            <TextInput style={s.input} value={formName} onChangeText={setFormName} placeholder="e.g. Premium Milk" placeholderTextColor={C.textTer} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Price (₹)</Text>
                <TextInput style={s.input} value={formPrice} onChangeText={setFormPrice} placeholder="0.0" keyboardType="decimal-pad" placeholderTextColor={C.textTer} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Unit</Text>
                <TextInput style={s.input} value={formUnit} onChangeText={setFormUnit} placeholder="liter, packet..." placeholderTextColor={C.textTer} />
              </View>
            </View>

            <Text style={s.inputLabel}>Description (Optional)</Text>
            <TextInput style={[s.input, { height: 80 }]} value={formDesc} onChangeText={setFormDesc} placeholder="Product details..." multiline placeholderTextColor={C.textTer} />

            <TouchableOpacity style={[s.primaryBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>Save Product</Text>}
            </TouchableOpacity>
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
  screen:        { flex: 1, backgroundColor: C.bg },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  listHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  listTitle:     { color: C.textPri, fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  countBadge:    { backgroundColor: C.surfaceVar, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  countText:     { color: C.textPri, fontSize: 13, fontWeight: '600' },
  addBtn:        { backgroundColor: C.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  addBtnText:    { color: '#fff', fontSize: 24, fontWeight: '400', lineHeight: 28 },
  card:          { backgroundColor: C.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardDisabled:  { opacity: 0.6 },
  iconBox:       { width: 48, height: 48, borderRadius: 12, backgroundColor: C.inputFill, justifyContent: 'center', alignItems: 'center' },
  productName:   { color: C.textPri, fontSize: 16, fontWeight: '600', letterSpacing: -0.2, marginBottom: 4 },
  productPrice:  { color: C.primary, fontSize: 15, fontWeight: '700' },
  productUnit:   { color: C.textSec, fontSize: 13, fontWeight: '400' },
  statusText:    { fontSize: 11, fontWeight: '600', marginTop: 4 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:    { color: C.textPri, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  inputLabel:    { color: C.textSec, fontSize: 13, marginBottom: 6 },
  input:         { backgroundColor: C.inputFill, borderRadius: 12, color: C.textPri, fontSize: 15, paddingHorizontal: 16, height: 50, marginBottom: 16 },
  primaryBtn:    { backgroundColor: C.primary, borderRadius: 12, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  primaryBtnText:{ color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  empty:         { textAlign: 'center', color: C.textSec, marginTop: 80, fontSize: 15 },
});
