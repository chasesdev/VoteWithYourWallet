import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../constants/design';

export default function TermsOfServiceScreen() {
  const lastUpdated = "January 2024";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.lastUpdated}>Last Updated: {lastUpdated}</Text>
          
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.text}>
            By accessing and using VoteWithYourWallet ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </Text>

          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.text}>
            VoteWithYourWallet is a platform that helps users discover businesses that align with their personal values and political preferences. 
            We provide information about businesses' political donations, stances, and activities to help users make informed consumer choices.
          </Text>

          <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
          <Text style={styles.text}>
            Users are responsible for:
            {'\n'}• Providing accurate information when creating accounts
            {'\n'}• Using the service in compliance with all applicable laws
            {'\n'}• Not attempting to harm, hack, or disrupt the service
            {'\n'}• Respecting the privacy and rights of other users
            {'\n'}• Not sharing account credentials with others
          </Text>

          <Text style={styles.sectionTitle}>4. Data and Information</Text>
          <Text style={styles.text}>
            The political alignment and business information provided by VoteWithYourWallet is compiled from publicly available sources including:
            {'\n'}• Federal Election Commission (FEC) records
            {'\n'}• Public corporate statements and press releases
            {'\n'}• News reports and verified media sources
            {'\n'}• User-contributed information (verified when possible)
            {'\n\n'}While we strive for accuracy, we cannot guarantee the completeness or absolute accuracy of all information.
          </Text>

          <Text style={styles.sectionTitle}>5. User-Generated Content</Text>
          <Text style={styles.text}>
            By submitting reviews, ratings, or other content to the Service, you grant VoteWithYourWallet a non-exclusive, worldwide, royalty-free license to use, 
            modify, and display such content in connection with the Service. You retain ownership of your content and may request its removal at any time.
          </Text>

          <Text style={styles.sectionTitle}>6. Privacy and Data Protection</Text>
          <Text style={styles.text}>
            Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, 
            which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of 
            your information as outlined in the Privacy Policy.
          </Text>

          <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
          <Text style={styles.text}>
            The Service and its original content, features, and functionality are owned by VoteWithYourWallet and are protected by 
            international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </Text>

          <Text style={styles.sectionTitle}>8. Disclaimers</Text>
          <Text style={styles.text}>
            VoteWithYourWallet is provided "as is" and "as available" without any representations or warranties, express or implied. 
            We do not warrant that:
            {'\n'}• The service will be uninterrupted or error-free
            {'\n'}• All information provided is current or accurate
            {'\n'}• The service will meet your specific requirements
            {'\n'}• Any defects will be corrected
          </Text>

          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.text}>
            In no event shall VoteWithYourWallet, its directors, employees, or agents be liable for any indirect, incidental, special, 
            consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
            resulting from your use of the Service.
          </Text>

          <Text style={styles.sectionTitle}>10. Political Neutrality Disclaimer</Text>
          <Text style={styles.text}>
            VoteWithYourWallet aims to provide factual information to help users make informed decisions based on their personal values. 
            We do not endorse any particular political party, candidate, or ideology. The platform is designed to serve users across 
            the political spectrum by providing transparent information about business practices and political activities.
          </Text>

          <Text style={styles.sectionTitle}>11. Termination</Text>
          <Text style={styles.text}>
            We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, 
            under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
          </Text>

          <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
          <Text style={styles.text}>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days 
            notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </Text>

          <Text style={styles.sectionTitle}>13. Governing Law</Text>
          <Text style={styles.text}>
            These Terms shall be governed and construed in accordance with the laws of the United States and the State of California, 
            without regard to its conflict of law provisions.
          </Text>

          <Text style={styles.sectionTitle}>14. Contact Information</Text>
          <Text style={styles.text}>
            If you have any questions about these Terms of Service, please contact us at:
            {'\n\n'}Email: legal@votewithyourwallet.com
            {'\n'}Website: https://votewithyourwallet.com/contact
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing to use VoteWithYourWallet, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  text: {
    fontSize: Typography.sizes.md,
    lineHeight: 22,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  footer: {
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  footerText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
