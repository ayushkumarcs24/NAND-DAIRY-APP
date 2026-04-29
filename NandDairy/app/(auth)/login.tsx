import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated, Image
} from 'react-native';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Ellipse, Path, Circle, Line, Defs, Pattern } from 'react-native-svg';
import { API_URL } from '../../constants/ApiHelper';
import { useAuth } from '../../context/AuthContext';

/* ── SVG Icons ── */
const MilkGlassIcon = () => (
  <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <Rect x="12" y="9" width="16" height="18" rx="3.5" fill="#fff8ec" />
    <Rect x="14" y="5" width="12" height="7" rx="2.5" fill="#e8d0a8" />
    <Ellipse cx="20" cy="27" rx="8" ry="5.5" fill="#fff8ec" opacity="0.95" />
    <Ellipse cx="20" cy="24" rx="5.5" ry="3.2" fill="#e8d0a8" opacity="0.55" />
    <Ellipse cx="17" cy="15" rx="1.8" ry="3" fill="rgba(255,255,255,0.28)" rotation="-15" origin="17, 15" />
  </Svg>
);

const PhoneIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Rect x="5" y="1.5" width="10" height="17" rx="2.5" stroke="#b07d3a" strokeWidth="1.4" />
    <Circle cx="10" cy="15.5" r="1.1" fill="#b07d3a" />
    <Rect x="8" y="4" width="4" height="1.2" rx="0.6" fill="#b07d3a" />
  </Svg>
);

const EyeOpenIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z" stroke="#b07d3a" strokeWidth="1.4" fill="none" />
    <Circle cx="10" cy="10" r="2.2" fill="#b07d3a" />
  </Svg>
);

const EyeClosedIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z" stroke="#b07d3a" strokeWidth="1.4" fill="none" />
    <Circle cx="10" cy="10" r="2.2" fill="#b07d3a" />
    <Line x1="3" y1="3" x2="17" y2="17" stroke="#b07d3a" strokeWidth="1.4" strokeLinecap="round" />
  </Svg>
);

/* ── FloatInput Component ── */
interface FloatInputProps {
  label: string;
  type?: "text" | "password" | "tel";
  maxLength?: number;
  value: string;
  onChange: (val: string) => void;
  rightIcon?: React.ReactNode;
  onIconClick?: () => void;
  iconActive?: boolean;
}

const FloatInput: React.FC<FloatInputProps> = ({
  label, type = "text", maxLength, value, onChange, rightIcon, onIconClick, iconActive,
}) => {
  const [focused, setFocused] = useState(false);
  const animatedFloat = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedFloat, {
      toValue: focused || value.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // Must be false for font size/color
    }).start();
  }, [focused, value]);

  const top = animatedFloat.interpolate({ inputRange: [0, 1], outputRange: [18, 5] });
  const fontSize = animatedFloat.interpolate({ inputRange: [0, 1], outputRange: [15, 10] });
  const color = animatedFloat.interpolate({ inputRange: [0, 1], outputRange: ['#c4a878', '#8a5e20'] });

  return (
    <View style={S.field}>
      <Animated.Text style={[S.label, { top, fontSize, color, fontWeight: focused || value ? '500' : '400', letterSpacing: focused || value ? 0.7 : 0 }]}>
        {focused || value ? label.toUpperCase() : label}
      </Animated.Text>
      
      <TextInput
        style={[S.input, focused && S.inputFocused]}
        value={value}
        maxLength={maxLength}
        keyboardType={type === "tel" ? "numeric" : "default"}
        secureTextEntry={type === "password"}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChangeText={onChange}
      />

      {rightIcon && (
        <TouchableOpacity style={[S.fieldIcon, iconActive && S.fieldIconActive]} onPress={onIconClick} activeOpacity={0.7}>
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
};

/* ── Main Login Screen ── */
export default function NandDairyLogin() {
  const [mobile, setMobile]     = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    setError("");
    if (!mobile || mobile.length !== 10) { setError("Please enter a valid 10-digit mobile number."); return; }
    if (!password) { setError("Please enter your password."); return; }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, { mobile_number: mobile, password });
      const { token, user } = response.data;
      await signIn(token, user.role, user.name);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error. Please check the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#ecdfc9', '#dfc9a8', '#c9aa82']} style={S.page} start={{x:0, y:0}} end={{x:1, y:1}}>
        
        {/* Dot Overlay */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <Circle cx="1" cy="1" r="1.5" fill="rgba(180,140,90,0.18)" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#dots)" />
          </Svg>
        </View>

        {/* Decorative Rings */}
        <View style={[S.ringBase, S.ringTrOuter]} />
        <View style={[S.ringBase, S.ringTrInner]} />
        <View style={[S.ringBase, S.ringBl]} />

        {/* Bokeh blobs */}
        <View style={[S.blobBase, { width: 200, height: 200, top: 20, left: -60, backgroundColor: 'rgba(255,255,255,0.22)' }]} />
        <View style={[S.blobBase, { width: 130, height: 130, bottom: 110, right: 10, backgroundColor: 'rgba(255,248,235,0.30)' }]} />
        <View style={[S.blobBase, { width: 90, height: 90, top: 190, right: 28, backgroundColor: 'rgba(255,255,255,0.15)' }]} />

        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={S.card}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView" />
            
            {/* Brand */}
            <View style={S.logoWrap}>
              <View style={[S.iconCircle, { backgroundColor: 'transparent', shadowColor: 'transparent', elevation: 0 }]}>
                <Image 
                  source={require('../../assets/images/nand-dairy-logo.png')} 
                  style={{ width: 100, height: 100, borderRadius: 50 }} 
                  resizeMode="contain" 
                />
              </View>
              <Text style={S.brandName}>Nand Dairy</Text>
              <Text style={S.brandSub}>Cooperative Management</Text>
              <LinearGradient colors={['#b07d3a', '#d4aa70']} style={S.brandDivider} start={{x:0, y:0}} end={{x:1, y:0}} />
            </View>

            {/* Fields */}
            <View style={S.fieldsWrap}>
              <FloatInput
                label="Mobile Number"
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={setMobile}
                rightIcon={<PhoneIcon />}
              />
              <FloatInput
                label="Password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={setPassword}
                rightIcon={showPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
                onIconClick={() => setShowPass(!showPass)}
                iconActive={showPass}
              />
              {!!error && (
                <Text style={{ fontSize: 12, color: "#c0392b", marginTop: -8, marginBottom: 8, paddingLeft: 4 }}>
                  {error}
                </Text>
              )}
            </View>

            {/* Button */}
            <TouchableOpacity 
              style={[S.signInBtnWrap, loading && { opacity: 0.7 }]} 
              onPress={handleSignIn} 
              disabled={loading} 
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#b07d3a', '#7a5220']} style={S.signInBtn} start={{x:0, y:0}} end={{x:1, y:1}}>
                {loading ? <ActivityIndicator color="#fff8ec" size="small" /> : (
                  <>
                    <Text style={S.btnText}>Sign In</Text>
                    <View style={S.btnArrow}>
                      <Text style={{ color: '#fff8ec', fontSize: 14 }}>→</Text>
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={S.versionTag}>Nand Dairy v2.0</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

/* ── Styles ── */
const S = StyleSheet.create({
  page: {
    flex: 1,
  },
  ringBase: {
    position: 'absolute',
    borderRadius: 500,
    backgroundColor: 'transparent',
  },
  ringTrOuter: {
    top: -120, right: -120,
    width: 400, height: 400,
    borderWidth: 42, borderColor: 'rgba(255,255,255,0.18)',
  },
  ringTrInner: {
    top: -55, right: -55,
    width: 230, height: 230,
    borderWidth: 26, borderColor: 'rgba(255,255,255,0.12)',
  },
  ringBl: {
    bottom: -110, left: -110,
    width: 320, height: 320,
    borderWidth: 34, borderColor: 'rgba(255,255,255,0.14)',
  },
  blobBase: {
    position: 'absolute',
    borderRadius: 500,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 28,
    paddingHorizontal: 36,
    paddingTop: 44,
    paddingBottom: 38,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 252, 245, 0.70)',
    borderColor: 'rgba(255, 250, 238, 0.95)',
    borderWidth: 1,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconCircle: {
    width: 80, height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4a3210',
    letterSpacing: -0.4,
    marginBottom: 5,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#a07840',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  brandDivider: {
    width: 34, height: 3,
    borderRadius: 2,
    marginTop: 14,
  },
  fieldsWrap: {
    marginBottom: 4,
  },
  field: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 58,
    paddingTop: 18,
    paddingBottom: 4,
    paddingLeft: 18,
    paddingRight: 48,
    backgroundColor: 'rgba(255,252,242,0.80)',
    borderWidth: 1.5,
    borderColor: 'rgba(180,140,80,0.28)',
    borderRadius: 14,
    fontSize: 15,
    color: '#3a2a0e',
  },
  inputFocused: {
    borderColor: '#b07d3a',
    backgroundColor: '#fffdf5',
  },
  label: {
    position: 'absolute',
    left: 18,
    zIndex: 1,
  },
  fieldIcon: {
    position: 'absolute',
    right: 15,
    top: 19,
    opacity: 0.45,
  },
  fieldIconActive: {
    opacity: 0.85,
  },
  signInBtnWrap: {
    marginTop: 10,
    borderRadius: 14,
    shadowColor: '#7a5220',
    shadowOpacity: 0.36,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 22,
    elevation: 8,
  },
  signInBtn: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff8ec',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginRight: 12,
  },
  btnArrow: {
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionTag: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 11,
    color: '#b8966a',
    letterSpacing: 0.5,
  },
});
