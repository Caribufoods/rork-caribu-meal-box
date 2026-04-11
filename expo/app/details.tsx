import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Truck } from 'lucide-react-native';

import { caribuTheme } from '@/constants/caribu-theme';
import { useCaribu } from '@/providers/caribu-provider';
import { useAuth } from '@/providers/auth-provider';
import { usePromotions } from '@/providers/promotions-provider';
import type { CustomerDetails } from '@/types/caribu';

export default function DetailsScreen() {
  const router = useRouter();
  const { cart, cartTotal, details, updateDetails, submitOrder } = useCaribu();
  const { isLoggedIn, user } = useAuth();
  const { selectedPromotion, markPromoUsed } = usePromotions();
  const [form, setForm] = useState<CustomerDetails>(details);

  const addressRequired = useMemo(() => form.fulfilment === 'delivery', [form.fulfilment]);

  const handleContinue = () => {
    if (!form.name.trim() || !form.phone.trim() || (addressRequired && !form.address.trim())) {
      Alert.alert('Missing details', 'Please add your name, phone number, and address for delivery orders.');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Cart empty', 'Add at least one box before continuing to confirmation.');
      return;
    }

    updateDetails(form);

    let discountAmount = 0;
    let promoCode: string | null = null;
    if (selectedPromotion) {
      discountAmount = cartTotal * (selectedPromotion.discountPercent / 100);
      promoCode = selectedPromotion.code;
    }

    submitOrder(discountAmount, promoCode);

    if (selectedPromotion && isLoggedIn) {
      void markPromoUsed(selectedPromotion.id);
    }

    router.push('/confirmation');
  };

  const handleChange = <Key extends keyof CustomerDetails>(key: Key, value: CustomerDetails[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.segmentRow}>
          {([
            { key: 'delivery' as const, icon: Truck, label: 'Delivery' },
            { key: 'pickup' as const, icon: MapPin, label: 'Pickup' },
          ]).map(({ key, icon: Icon, label }) => {
            const active = form.fulfilment === key;
            return (
              <Pressable
                key={key}
                onPress={() => handleChange('fulfilment', key)}
                style={[styles.segment, active && styles.segmentActive]}
                testID={`fulfilment-${key}`}
              >
                <Icon color={active ? caribuTheme.white : caribuTheme.muted} size={18} />
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => handleChange('name', value)}
              placeholder="Jane Smith"
              placeholderTextColor={caribuTheme.muted}
              style={styles.input}
              testID="details-name-input"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              value={form.phone}
              onChangeText={(value) => handleChange('phone', value)}
              placeholder="07123 456789"
              placeholderTextColor={caribuTheme.muted}
              keyboardType="phone-pad"
              style={styles.input}
              testID="details-phone-input"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{addressRequired ? 'Delivery address' : 'Pickup notes'}</Text>
            <TextInput
              value={form.address}
              onChangeText={(value) => handleChange('address', value)}
              placeholder={addressRequired ? '15 Market Lane, London' : 'Collection at front desk'}
              placeholderTextColor={caribuTheme.muted}
              multiline
              style={[styles.input, styles.textArea]}
              testID="details-address-input"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Order notes</Text>
            <TextInput
              value={form.notes}
              onChangeText={(value) => handleChange('notes', value)}
              placeholder="Allergies, buzzer number, handoff preference"
              placeholderTextColor={caribuTheme.muted}
              multiline
              style={[styles.input, styles.notesArea]}
              testID="details-notes-input"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
          testID="details-confirm-button"
        >
          <Text style={styles.confirmText}>Confirm Order</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: caribuTheme.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 20,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: caribuTheme.surface,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    borderRadius: 14,
    paddingVertical: 14,
  },
  segmentActive: {
    backgroundColor: caribuTheme.charcoal,
    borderColor: caribuTheme.charcoal,
  },
  segmentText: {
    color: caribuTheme.muted,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  segmentTextActive: {
    color: caribuTheme.white,
  },
  formCard: {
    backgroundColor: caribuTheme.surface,
    borderRadius: 20,
    padding: 18,
    gap: 18,
    borderWidth: 1,
    borderColor: caribuTheme.line,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: caribuTheme.ink,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: caribuTheme.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: caribuTheme.ink,
    fontSize: 15,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  notesArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  confirmBtn: {
    backgroundColor: caribuTheme.forest,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmText: {
    color: caribuTheme.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
