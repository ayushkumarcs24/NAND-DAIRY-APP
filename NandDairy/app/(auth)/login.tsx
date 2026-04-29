import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform,
  Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../../constants/ApiHelper';
import { useAuth } from '../../context/AuthContext';
import { C } from '../../constants/Theme';

export default function LoginScreen() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword]         = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!mobileNumber || !password) { setError('Both fields are required.'); return; }
    try {
      setLoading(true); setError('');
      const response = await axios.post(`${API_URL}/auth/login`, {
        mobile_number: mobileNumber, password,
      });
      const { token, user } = response.data;
      await signIn(token, user.role);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error. Please check the server.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Logo area ── */}
      <View style={s.logoArea}>
        <View style={s.logoHalo}>
          <Text style={s.logoEmoji}>🥛</Text>
        </View>
        <Text style={s.logoTitle}>Nand Dairy</Text>
        <Text style={s.logoSub}>Cooperative Management System</Text>
        <View style={s.accentLine} />
      </View>

      {/* ── Form sheet ── */}
      <View style={s.formSheet}>

        {/* Mobile input */}
        <Text style={s.label}>Mobile Number</Text>
        <View style={s.inputWrap}>
          <Text style={s.inputIcon}>📱</Text>
          <TextInput
            style={s.input}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="numeric"
            maxLength={10}
            placeholder="10-digit mobile"
            placeholderTextColor={C.textTer}
            autoCapitalize="none"
          />
        </View>

        {/* Password input */}
        <Text style={s.label}>Password</Text>
        <View style={s.inputWrap}>
          <Text style={s.inputIcon}>🔒</Text>
          <TextInput
            style={[s.input, { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            placeholder="Password"
            placeholderTextColor={C.textTer}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
            <Text style={{ color: C.textSec, fontSize: 16 }}>{showPass ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {!!error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.buttonText}>Sign In  →</Text>
          }
        </TouchableOpacity>

        <Text style={s.version}>Nand Dairy v2.0</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: C.white },

  // Logo
  logoArea:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  logoHalo:    {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  logoEmoji:   { fontSize: 44 },
  logoTitle:   { fontSize: 28, fontWeight: '800', color: C.textPri, letterSpacing: -0.8, marginBottom: 6 },
  logoSub:     { fontSize: 13, color: C.textSec, fontWeight: '500', marginBottom: 16 },
  accentLine:  { width: 40, height: 3, borderRadius: 2, backgroundColor: C.primary },

  // Form Sheet
  formSheet:   {
    backgroundColor: C.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48,
  },
  label:       { fontSize: 12, fontWeight: '600', color: C.textSec, letterSpacing: 0.5, marginBottom: 8 },
  inputWrap:   {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, marginBottom: 16, height: 52,
  },
  inputIcon:   { fontSize: 18, marginRight: 10 },
  input:       { flex: 1, color: C.textPri, fontSize: 15 },
  eyeBtn:      { padding: 4 },
  errorBox:    { backgroundColor: C.errorBg, borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText:   { color: C.error, fontSize: 13, fontWeight: '500' },
  button:      {
    backgroundColor: C.primary, borderRadius: 16, height: 56,
    justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 20,
    shadowColor: C.primary, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 },
    shadowRadius: 20, elevation: 8,
  },
  buttonText:  { color: '#fff', fontSize: 17, fontWeight: '700' },
  version:     { color: C.textTer, fontSize: 12, textAlign: 'center' },
});
