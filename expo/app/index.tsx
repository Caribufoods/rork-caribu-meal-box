import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const logoImage = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8vpd7aucvwric7vv5ajx7';
const bgImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80';

const GOLD = '#C9A96E';
const GOLD_LIGHT = 'rgba(201,169,110,0.15)';
const FOREST = '#2D6A4F';
const CHARCOAL = '#1A1A1A';
const DEEP_BG = '#0D0D0D';

export default function OnboardingScreen() {
  const router = useRouter();

  const logoFade = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-20)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const dividerScale = useRef(new Animated.Value(0)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(40)).current;
  const guestFade = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(1.1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bgScale, {
      toValue: 1,
      duration: 8000,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(logoFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(logoSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.timing(taglineFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(dividerScale, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(btnFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(btnSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(guestFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [logoFade, logoSlide, taglineFade, dividerScale, btnFade, btnSlide, guestFade, bgScale, shimmer]);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  const handleLogin = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/sign-in');
  }, [router]);

  const handleSignUp = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/sign-up');
  }, [router]);

  const handleGuest = useCallback(() => {
    void Haptics.selectionAsync();
    router.replace('/home');
  }, [router]);

  const loginScale = useRef(new Animated.Value(1)).current;
  const signupScale = useRef(new Animated.Value(1)).current;
  const guestScale = useRef(new Animated.Value(1)).current;

  const animateButtonPress = useCallback((scale: Animated.Value, onComplete: () => void) => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(onComplete);
  }, []);

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.bgImageContainer, { transform: [{ scale: bgScale }] }]}>
        <Image
          source={{ uri: bgImage }}
          style={styles.bgImage}
          contentFit="cover"
          transition={600}
        />
      </Animated.View>

      <LinearGradient
        colors={[
          'rgba(13,13,13,0.3)',
          'rgba(13,13,13,0.5)',
          'rgba(13,13,13,0.85)',
          DEEP_BG,
        ]}
        locations={[0, 0.3, 0.6, 0.85]}
        style={styles.overlay}
      />

      <View style={styles.accentLine} />

      <View style={styles.contentContainer}>
        <View style={styles.topSection}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoFade,
                transform: [{ translateY: logoSlide }],
              },
            ]}
          >
            <Image
              source={{ uri: logoImage }}
              style={styles.logo}
              contentFit="contain"
              transition={300}
            />
          </Animated.View>

          <Animated.View style={[styles.taglineContainer, { opacity: taglineFade }]}>
            <Text style={styles.tagline}>Curated meals, crafted for you</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.divider,
              { transform: [{ scaleX: dividerScale }] },
            ]}
          >
            <LinearGradient
              colors={['transparent', GOLD, 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.dividerGradient}
            />
          </Animated.View>
        </View>

        <View style={styles.bottomSection}>
          <Animated.View
            style={[
              styles.buttonsContainer,
              {
                opacity: btnFade,
                transform: [{ translateY: btnSlide }],
              },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: loginScale }] }}>
              <Pressable
                onPress={() => animateButtonPress(loginScale, handleLogin)}
                style={({ pressed }) => [styles.loginBtn, pressed && styles.btnPressed]}
                testID="onboarding-login"
                accessibilityRole="button"
                accessibilityLabel="Log In"
              >
                <LinearGradient
                  colors={[FOREST, '#1B4332']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginGradient}
                >
                  <Text style={styles.loginText}>Log In</Text>
                  <Animated.View style={[styles.loginShimmer, { opacity: shimmerOpacity }]} />
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: signupScale }] }}>
              <Pressable
                onPress={() => animateButtonPress(signupScale, handleSignUp)}
                style={({ pressed }) => [styles.signUpBtn, pressed && styles.btnPressed]}
                testID="onboarding-signup"
                accessibilityRole="button"
                accessibilityLabel="Sign Up"
              >
                <Text style={styles.signUpText}>Sign Up</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.guestContainer, { opacity: guestFade }]}>
            <Animated.View style={{ transform: [{ scale: guestScale }] }}>
              <Pressable
                onPress={() => animateButtonPress(guestScale, handleGuest)}
                hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
                testID="onboarding-guest"
                accessibilityRole="button"
                accessibilityLabel="Continue as Guest"
              >
                <Text style={styles.guestText}>Continue as Guest</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: guestFade }]}>
            <View style={styles.footerDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DEEP_BG,
  },
  bgImageContainer: {
    ...StyleSheet.absoluteFillObject,
    height: SCREEN_HEIGHT * 0.65,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: GOLD,
    opacity: 0.6,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: SCREEN_HEIGHT * 0.15,
    paddingBottom: SCREEN_HEIGHT * 0.05,
  },
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 180,
    height: 54,
  },
  taglineContainer: {
    marginBottom: 24,
  },
  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
  },
  divider: {
    width: 60,
    height: 1,
    overflow: 'hidden',
  },
  dividerGradient: {
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 28,
    gap: 20,
  },
  buttonsContainer: {
    gap: 14,
  },
  loginBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: FOREST,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  loginGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
  },
  loginShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  signUpBtn: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD_LIGHT,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  signUpText: {
    color: GOLD,
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  btnPressed: {
    opacity: 0.85,
  },
  guestContainer: {
    alignItems: 'center',
    paddingTop: 4,
  },
  guestText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    backgroundColor: GOLD,
    width: 20,
    borderRadius: 3,
  },
});
