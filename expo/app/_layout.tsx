import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthContextProvider } from '@/providers/auth-provider';
import { CaribuProvider } from '@/providers/caribu-provider';
import { PromotionsProvider } from '@/providers/promotions-provider';
import { AdminProvider } from '@/providers/admin-provider';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: '#FAFAF7' },
        headerTintColor: '#1A1A1A',
        contentStyle: { backgroundColor: '#FAFAF7' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="builder" options={{ title: 'Build Your Box' }} />
      <Stack.Screen name="menu" options={{ title: 'Menu' }} />
      <Stack.Screen name="menus" options={{ title: 'Our Menu' }} />
      <Stack.Screen name="cart" options={{ title: 'Your Cart' }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
      <Stack.Screen name="confirmation" options={{ title: 'Order Confirmed' }} />
      <Stack.Screen name="order-history" options={{ title: 'Order History' }} />
      <Stack.Screen name="promotions" options={{ title: 'Promotions' }} />
      <Stack.Screen name="admin" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthContextProvider>
          <CaribuProvider>
            <PromotionsProvider>
              <AdminProvider>
                <RootLayoutNav />
              </AdminProvider>
            </PromotionsProvider>
          </CaribuProvider>
        </AuthContextProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
