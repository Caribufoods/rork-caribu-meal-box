import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { caribuTheme } from '@/constants/caribu-theme';
import { useAuth } from '@/providers/auth-provider';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, socialSignIn, isSigningUp, isSocialSigningIn } = useAuth();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);
  const [buttonScale] = useState(new Animated.Value(1));

  const animatePress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    callback();
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields to create your account.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (!privacyAccepted) {
      Alert.alert('Privacy Policy', 'You must agree to the Privacy Policy to create an account.');
      return;
    }
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signUp({ name: name.trim(), email: email.trim(), password });
      router.back();
    } catch (error) {
      console.log('[Auth] Sign up error:', error);
      Alert.alert('Sign up failed', 'Something went wrong. Please try again.');
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await socialSignIn(provider);
      router.back();
    } catch (error) {
      console.log('[Auth] Social sign up error:', error);
      Alert.alert('Sign up failed', 'Something went wrong. Please try again.');
    }
  };

  const isLoading = isSigningUp || isSocialSigningIn;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            testID="sign-up-back"
          >
            <ArrowLeft color={caribuTheme.ink} size={20} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleSection}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Join Caribu and get <Text style={styles.highlightText}>20% off</Text> your first order.
            </Text>
          </View>

          <View style={styles.bonusBanner}>
            <Text style={styles.bonusEmoji}>🎉</Text>
            <View style={styles.bonusTextWrap}>
              <Text style={styles.bonusTitle}>Welcome bonus</Text>
              <Text style={styles.bonusDesc}>Sign up now and receive an instant 20% discount</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <User color={caribuTheme.muted} size={18} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  placeholderTextColor={caribuTheme.muted}
                  autoCapitalize="words"
                  style={styles.input}
                  testID="sign-up-name"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Mail color={caribuTheme.muted} size={18} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor={caribuTheme.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  testID="sign-up-email"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock color={caribuTheme.muted} size={18} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor={caribuTheme.muted}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  testID="sign-up-password"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  {showPassword ? (
                    <EyeOff color={caribuTheme.muted} size={18} />
                  ) : (
                    <Eye color={caribuTheme.muted} size={18} />
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.privacyRow}>
              <Pressable
                onPress={() => setPrivacyAccepted((v) => !v)}
                style={[styles.checkbox, privacyAccepted && styles.checkboxChecked]}
                testID="sign-up-privacy-checkbox"
              >
                {privacyAccepted && <Check color={caribuTheme.white} size={14} strokeWidth={3} />}
              </Pressable>
              <Text style={styles.privacyText}>
                I agree to the{' '}
                <Text
                  style={styles.privacyLink}
                  onPress={() => router.push('/privacy-policy')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Pressable
                onPress={() => animatePress(handleSignUp)}
                disabled={isLoading || !privacyAccepted}
                style={({ pressed }) => [styles.signUpBtn, pressed && styles.pressed, (isLoading || !privacyAccepted) && styles.disabled]}
                testID="sign-up-submit"
              >
                {isSigningUp ? (
                  <ActivityIndicator color={caribuTheme.white} size="small" />
                ) : (
                  <Text style={styles.signUpBtnText}>Create Account</Text>
                )}
              </Pressable>
            </Animated.View>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <Pressable
              onPress={() => handleSocialSignIn('google')}
              disabled={isLoading}
              style={({ pressed }) => [styles.socialBtn, pressed && styles.socialBtnPressed]}
              testID="sign-up-google"
            >
              <Text style={styles.socialBtnIcon}>G</Text>
              <Text style={styles.socialBtnLabel}>Google</Text>
            </Pressable>

            <Pressable
              onPress={() => handleSocialSignIn('apple')}
              disabled={isLoading}
              style={({ pressed }) => [styles.socialBtn, styles.socialBtnDark, pressed && styles.socialBtnPressed]}
              testID="sign-up-apple"
            >
              <Text style={[styles.socialBtnIcon, styles.socialBtnIconLight]}>&#xF8FF;</Text>
              <Text style={[styles.socialBtnLabel, styles.socialBtnLabelLight]}>Apple</Text>
            </Pressable>

            <Pressable
              onPress={() => handleSocialSignIn('facebook')}
              disabled={isLoading}
              style={({ pressed }) => [styles.socialBtn, styles.socialBtnFb, pressed && styles.socialBtnPressed]}
              testID="sign-up-facebook"
            >
              <Text style={[styles.socialBtnIcon, styles.socialBtnIconLight]}>f</Text>
              <Text style={[styles.socialBtnLabel, styles.socialBtnLabelLight]}>Facebook</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              router.replace('/sign-in' as never);
            }}
            style={styles.switchRow}
            testID="sign-up-to-sign-in"
          >
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: caribuTheme.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: caribuTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: caribuTheme.line,
  },
  backBtnPressed: {
    backgroundColor: caribuTheme.card,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 20,
    gap: 8,
  },
  title: {
    color: caribuTheme.ink,
    fontSize: 30,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: caribuTheme.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  highlightText: {
    color: caribuTheme.forest,
    fontWeight: '700' as const,
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7F2',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D4E8DA',
  },
  bonusEmoji: {
    fontSize: 28,
  },
  bonusTextWrap: {
    flex: 1,
    gap: 2,
  },
  bonusTitle: {
    color: caribuTheme.forest,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  bonusDesc: {
    color: caribuTheme.moss,
    fontSize: 13,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: caribuTheme.surface,
    borderRadius: 20,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: caribuTheme.line,
  },
  inputGroup: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: caribuTheme.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 12,
    height: 54,
  },
  input: {
    flex: 1,
    color: caribuTheme.ink,
    fontSize: 15,
    height: 54,
  },
  signUpBtn: {
    backgroundColor: caribuTheme.forest,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  signUpBtnText: {
    color: caribuTheme.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: caribuTheme.line,
  },
  dividerText: {
    color: caribuTheme.muted,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  socialRow: {
    gap: 12,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: caribuTheme.surface,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    borderRadius: 14,
    paddingVertical: 14,
  },
  socialBtnDark: {
    backgroundColor: caribuTheme.ink,
    borderColor: caribuTheme.ink,
  },
  socialBtnFb: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialBtnPressed: {
    opacity: 0.85,
  },
  socialBtnIcon: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: caribuTheme.ink,
  },
  socialBtnIconLight: {
    color: caribuTheme.white,
  },
  socialBtnLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: caribuTheme.ink,
  },
  socialBtnLabelLight: {
    color: caribuTheme.white,
  },
  switchRow: {
    marginTop: 28,
    alignItems: 'center',
  },
  switchText: {
    color: caribuTheme.muted,
    fontSize: 14,
  },
  switchLink: {
    color: caribuTheme.forest,
    fontWeight: '700' as const,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: caribuTheme.line,
    backgroundColor: caribuTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: caribuTheme.forest,
    borderColor: caribuTheme.forest,
  },
  privacyText: {
    flex: 1,
    color: caribuTheme.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  privacyLink: {
    color: caribuTheme.forest,
    fontWeight: '600' as const,
    textDecorationLine: 'underline' as const,
  },
});
