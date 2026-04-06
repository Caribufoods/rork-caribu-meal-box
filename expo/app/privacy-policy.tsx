import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import { caribuTheme } from '@/constants/caribu-theme';

const sections = [
  {
    title: '1. Information We Collect',
    body: `When you create an account with Caribu, we collect your name, email address, and login method (email, Google, Apple, or Facebook). We also collect order history, delivery addresses, payment preferences, and promotion usage data to provide and improve our services.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your information to:\n• Process and fulfil your food box orders\n• Manage your account and preferences\n• Send order confirmations and delivery updates\n• Administer promotions, referral rewards, and discounts\n• Improve our app experience and customer service\n• Comply with legal obligations`,
  },
  {
    title: '3. Data Sharing',
    body: `We do not sell your personal data. We may share limited information with trusted service providers who help us process payments, deliver orders, or maintain our platform. All third parties are bound by strict data protection agreements.`,
  },
  {
    title: '4. Data Security',
    body: `We implement industry-standard security measures to protect your personal information, including encryption, secure storage, and access controls. However, no method of electronic transmission is 100% secure.`,
  },
  {
    title: '5. Your Rights',
    body: `You have the right to:\n• Access your personal data\n• Correct inaccurate information\n• Request deletion of your account and data\n• Withdraw consent at any time\n• Export your data in a portable format`,
  },
  {
    title: '6. Data Retention',
    body: `We retain your personal data for as long as your account is active or as needed to provide our services. When you delete your account, all personal data is permanently removed from our systems within 30 days.`,
  },
  {
    title: '7. Cookies & Analytics',
    body: `Our app may use analytics tools to understand usage patterns and improve performance. We do not use tracking cookies for advertising purposes.`,
  },
  {
    title: '8. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of any material changes through the app or via email. Continued use of the app after changes constitutes acceptance.`,
  },
  {
    title: '9. Contact Us',
    body: `If you have questions about this Privacy Policy or your data, please contact us at:\n\nprivacy@caribu.com`,
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            testID="privacy-back"
          >
            <ArrowLeft color={caribuTheme.ink} size={20} />
          </Pressable>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lastUpdated}>Last updated: April 2026</Text>
          <Text style={styles.intro}>
            Caribu ("we", "our", "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our mobile application.
          </Text>

          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
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
  headerTitle: {
    color: caribuTheme.ink,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  lastUpdated: {
    color: caribuTheme.muted,
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 16,
  },
  intro: {
    color: caribuTheme.ink,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: caribuTheme.ink,
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  sectionBody: {
    color: caribuTheme.muted,
    fontSize: 14,
    lineHeight: 22,
  },
});
