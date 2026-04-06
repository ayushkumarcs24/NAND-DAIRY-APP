import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText } from 'react-native-paper';
import axios from 'axios';
import { API_URL } from '../../constants/ApiHelper';
import { useAuth } from '../../context/AuthContext';
import { DairyTheme } from '../../constants/Theme';

export default function LoginScreen() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
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
        password: password,
      });

      const { token, user } = response.data;
      
      // Save it into secure context allowing the RootLayout router switch to kick in
      await signIn(token, user.role);

    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Network error. Please make sure the server is healthy.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Surface style={styles.card} elevation={2}>
        <View style={styles.headerContainer}>
          <Text variant="displaySmall" style={styles.title}>Nand Dairy</Text>
          <Text variant="titleMedium" style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <TextInput
          label="Mobile Number"
          mode="outlined"
          value={mobileNumber}
          onChangeText={setMobileNumber}
          keyboardType="numeric"
          style={styles.input}
          maxLength={10}
          autoCapitalize="none"
        />

        <TextInput
          label="Password"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          autoCapitalize="none"
        />

        {!!error && (
            <HelperText type="error" visible={!!error} style={{ marginHorizontal: -10 }}>
              {error}
            </HelperText>
        )}

        <Button 
          mode="contained" 
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Login
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DairyTheme.colors.primary,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontWeight: 'bold',
    color: DairyTheme.colors.primary,
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  }
});
