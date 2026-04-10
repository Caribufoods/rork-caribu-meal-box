import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image } from 'expo-image';

import { caribuTheme } from '@/constants/caribu-theme';
import { CaribuProvider } from '@/providers/caribu-provider';
import { AuthContextProvider } from '@/providers/auth-provider';
import { PromotionsProvider } from '@/providers/promotions-provider';
import { AdminProvider } from '@/providers/admin-provider';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const logoUrl = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8vpd7aucvwric7vv5ajx7';

function HeaderLogo() {
  return (
    <View style={layoutStyles.headerLogoWrap}>
      <Image source={{ uri: logoUrl }} style={layoutStyles.headerLogo} contentFit="contain" />
    </View>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerShadowVisible: false,
        headerTintColor: caribuTheme.white,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: caribuTheme.charcoal,
        },
        headerTitleStyle: {
          fontWeight: '600' as const,
          fontSize: 17,
          color: caribuTheme.white,
        },
        contentStyle: {
          backgroundColor: caribuTheme.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="menu" options={{ headerTitle: () => <HeaderLogo /> }} />
      <Stack.Screen name="menus" options={{ headerTitle: () => <HeaderLogo /> }} />
      <Stack.Screen name="builder" options={{ headerTitle: () => <HeaderLogo /> }} />
      <Stack.Screen name="cart" options={{ headerTitle: () => <HeaderLogo /> }} />
      <Stack.Screen name="details" options={{ headerTitle: () => <HeaderLogo /> }} />
      <Stack.Screen name="confirmation" options={{ headerTitle: () => <HeaderLogo />, headerBackVisible: false }} />
      <Stack.Screen name="promotions" options={{ headerTitle: () => <HeaderLogo /> }} />
      <Stack.Screen name="order-history" options={{ headerTitle: () => <HeaderLogo /> }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="admin" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

const layoutStyles = StyleSheet.create({
  headerLogoWrap: {
    height: 28,
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 90,
    height: 28,
  },
});

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <PromotionsProvider>
          <AdminProvider>
            <CaribuProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <StatusBar style="light" />
              <RootLayoutNav />
            </GestureHandlerRootView>
            </CaribuProvider>
          </AdminProvider>
        </PromotionsProvider>
      </AuthContextProvider>
    </QueryClientProvider>
  );
}
