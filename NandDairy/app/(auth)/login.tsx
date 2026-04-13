import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView,
  Platform, Text, TextInput, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../../constants/ApiHelper';
import { useAuth } from '../../context/AuthContext';
import { C } from '../../constants/Theme';

export default function LoginScreen() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!mobileNumber || !password) {
      setError('Both fields are required.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${API_URL}/auth/login`, {
        mobile_number: mobileNumber,
        password,
      });
      const { token, user } = response.data;
      await signIn(token, user.role);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Network error. Please make sure the server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Logo area */}
      <View style={s.logoArea}>
        <Text style={s.logoEmoji}>🥛</Text>
        <Text style={s.logoTitle}>Nand Dairy</Text>
        <Text style={s.logoSub}>Dairy Management</Text>
      </View>

      {/* Card */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Sign In</Text>

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

        {!!error && <Text style={s.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[s.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.buttonText}>Login</Text>
          }
        </TouchableOpacity>
      </View>

      <Text style={s.version}>v1.0</Text>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: '#000', justifyContent: 'center', padding: 24 },
  logoArea:   { alignItems: 'center', marginBottom: 40 },
  logoEmoji:  { fontSize: 48, marginBottom: 8 },
  logoTitle:  { fontSize: 32, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  logoSub:    { fontSize: 14, color: C.textSec, marginTop: 4, letterSpacing: 0.2 },
  card:       { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 24 },
  cardTitle:  { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 20, letterSpacing: -0.3 },
  label:      { fontSize: 12, color: C.textSec, marginBottom: 6, letterSpacing: 0.1 },
  inputWrap:  {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceVar, borderRadius: 10,
    paddingHorizontal: 12, marginBottom: 16, height: 48,
  },
  inputIcon:  { fontSize: 16, marginRight: 8 },
  input:      { flex: 1, color: '#fff', fontSize: 15, letterSpacing: -0.2 },
  eyeBtn:     { padding: 4 },
  errorText:  { color: C.error, fontSize: 13, marginBottom: 12, letterSpacing: -0.1 },
  button:     {
    backgroundColor: C.primary, borderRadius: 10,
    height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  version:    { color: C.textTer, fontSize: 12, textAlign: 'center', marginTop: 32 },
});
