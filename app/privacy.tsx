import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../constants/design';

export default function PrivacyPolicyScreen() {
  const lastUpdated = "August 2025";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: {lastUpdated}</Text>
          
          <Text style={styles.introText}>
            At VoteWithYourWallet, we respect your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </Text>

          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          
          <Text style={styles.subsectionTitle}>Personal Information</Text>
          <Text style={styles.text}>
            We may collect the following personal information:
            {'\n'}• Name and email address (for account creation)
            {'\n'}• Location information (city, state, zip code)
            {'\n'}• Political preferences and alignment responses
            {'\n'}• Business reviews and ratings you submit
            {'\n'}• Profile information you choose to provide
          </Text>

          <Text style={styles.subsectionTitle}>Usage Information</Text>
          <Text style={styles.text}>
            We automatically collect certain information about your use of our service:
            {'\n'}• Device information (device type, operating system, browser type)
            {'\n'}• Log data (IP address, access times, pages viewed)
            {'\n'}• App usage patterns and interactions
            {'\n'}• Search queries and business interactions
            {'\n'}• Location data (if you grant permission)
          </Text>

          <Text style={styles.subsectionTitle}>Cookies and Tracking Technologies</Text>
          <Text style={styles.text}>
            We use cookies, web beacons, and similar technologies to:
            {'\n'}• Remember your preferences and settings
            {'\n'}• Analyze app usage and performance
            {'\n'}• Provide personalized recommendations
            {'\n'}• Improve our service functionality
          </Text>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.text}>
            We use the collected information for the following purposes:
            {'\n\n'}• <Text style={styles.bold}>Service Provision:</Text> To provide personalized business recommendations based on your political alignment and preferences
            {'\n\n'}• <Text style={styles.bold}>Account Management:</Text> To create and maintain your user account, authenticate your identity, and provide customer support
            {'\n\n'}• <Text style={styles.bold}>Personalization:</Text> To customize your experience and show relevant businesses and content
            {'\n\n'}• <Text style={styles.bold}>Analytics:</Text> To understand how users interact with our service and improve our platform
            {'\n\n'}• <Text style={styles.bold}>Communications:</Text> To send you updates, newsletters, and important service notifications (you can opt-out anytime)
            {'\n\n'}• <Text style={styles.bold}>Research:</Text> To conduct aggregated, anonymized research on consumer behavior and political preferences
          </Text>

          <Text style={styles.sectionTitle}>3. Information Sharing and Disclosure</Text>
          <Text style={styles.text}>
            We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:
          </Text>

          <Text style={styles.subsectionTitle}>With Your Consent</Text>
          <Text style={styles.text}>
            We may share your information when you explicitly consent to such sharing.
          </Text>

          <Text style={styles.subsectionTitle}>Service Providers</Text>
          <Text style={styles.text}>
            We may share information with trusted third-party service providers who help us operate our service:
            {'\n'}• Cloud hosting and database services
            {'\n'}• Analytics and performance monitoring tools
            {'\n'}• Email and communication services
            {'\n'}• Payment processing (if applicable)
            {'\n\n'}These providers are contractually obligated to protect your information and use it only for the specified purposes.
          </Text>

          <Text style={styles.subsectionTitle}>Aggregated and Anonymized Data</Text>
          <Text style={styles.text}>
            We may share aggregated, anonymized data that cannot identify you personally for research, 
            business intelligence, and public reporting purposes. This might include trends in political 
            alignment, consumer preferences, or demographic patterns.
          </Text>

          <Text style={styles.subsectionTitle}>Legal Requirements</Text>
          <Text style={styles.text}>
            We may disclose your information if required by law, court order, or government request, 
            or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.text}>
            We implement appropriate technical and organizational security measures to protect your personal information:
            {'\n'}• Encryption of data in transit and at rest
            {'\n'}• Secure authentication and access controls
            {'\n'}• Regular security audits and monitoring
            {'\n'}• Employee training on data protection practices
            {'\n\n'}However, no method of transmission over the Internet or electronic storage is 100% secure. 
            While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
          </Text>

          <Text style={styles.sectionTitle}>5. Data Retention</Text>
          <Text style={styles.text}>
            We retain your personal information only as long as necessary for the purposes outlined in this Privacy Policy:
            {'\n'}• Account information: Until you delete your account plus 30 days for backup purposes
            {'\n'}• Usage data: Up to 2 years for analytics and service improvement
            {'\n'}• Political alignment data: Until you delete your account or request removal
            {'\n'}• Reviews and ratings: May be retained longer for service integrity (anonymized after account deletion)
          </Text>

          <Text style={styles.sectionTitle}>6. Your Privacy Rights</Text>
          <Text style={styles.text}>
            Depending on your location, you may have the following rights regarding your personal information:
          </Text>

          <Text style={styles.subsectionTitle}>Access and Portability</Text>
          <Text style={styles.text}>
            • Request a copy of the personal information we hold about you
            {'\n'}• Export your data in a machine-readable format
          </Text>

          <Text style={styles.subsectionTitle}>Correction and Updates</Text>
          <Text style={styles.text}>
            • Update or correct inaccurate personal information
            {'\n'}• Modify your political alignment preferences at any time
          </Text>

          <Text style={styles.subsectionTitle}>Deletion</Text>
          <Text style={styles.text}>
            • Request deletion of your personal information ("right to be forgotten")
            {'\n'}• Delete your account and associated data through the app settings
          </Text>

          <Text style={styles.subsectionTitle}>Opt-Out Rights</Text>
          <Text style={styles.text}>
            • Opt-out of marketing communications
            {'\n'}• Disable location tracking
            {'\n'}• Opt-out of certain data collection practices
          </Text>

          <Text style={styles.text}>
            To exercise these rights, please contact us using the information provided at the end of this policy.
          </Text>

          <Text style={styles.sectionTitle}>7. Third-Party Services</Text>
          <Text style={styles.text}>
            Our service may contain links to third-party websites or integrate with third-party services. 
            We are not responsible for the privacy practices of these third parties. We encourage you to 
            review their privacy policies before providing any personal information.
            {'\n\n'}Third-party services we may use include:
            {'\n'}• Social media platforms (for sharing features)
            {'\n'}• Mapping and location services
            {'\n'}• Business directory APIs
            {'\n'}• Analytics and crash reporting services
          </Text>

          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.text}>
            VoteWithYourWallet is not intended for use by children under the age of 13. We do not knowingly 
            collect personal information from children under 13. If we become aware that we have collected 
            personal information from a child under 13, we will take steps to remove such information from our systems.
          </Text>

          <Text style={styles.sectionTitle}>9. International Users</Text>
          <Text style={styles.text}>
            Our service is hosted in the United States. If you access our service from outside the United States, 
            please be aware that your information may be transferred to, stored, and processed in the United States 
            where our servers are located and our central database is operated.
            {'\n\n'}For users in the European Union, we comply with applicable data protection laws including the 
            General Data Protection Regulation (GDPR). For users in California, we comply with the California 
            Consumer Privacy Act (CCPA).
          </Text>

          <Text style={styles.sectionTitle}>10. Political Data Handling</Text>
          <Text style={styles.text}>
            Given the political nature of our service, we take special care with politically-sensitive information:
            {'\n'}• Your political alignment data is encrypted and stored securely
            {'\n'}• We never share individual political preferences with third parties without explicit consent
            {'\n'}• Aggregated political trends are anonymized and cannot be traced back to individuals
            {'\n'}• You can modify or delete your political alignment data at any time
            {'\n'}• We do not use political data for advertising purposes outside our service
          </Text>

          <Text style={styles.sectionTitle}>11. Updates to This Privacy Policy</Text>
          <Text style={styles.text}>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
            When we make changes, we will:
            {'\n'}• Update the "Last Updated" date at the top of this policy
            {'\n'}• Notify you through the app or via email for material changes
            {'\n'}• Provide at least 30 days' notice for significant changes
            {'\n\n'}Your continued use of our service after any changes constitutes acceptance of the updated policy.
          </Text>

          <Text style={styles.sectionTitle}>12. Contact Us</Text>
          <Text style={styles.text}>
            If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            {'\n\n'}Email: privacy@votewithyourwallet.com
            {'\n'}Website: https://votewithyourwallet.com/privacy-contact
            {'\n'}Mail: VoteWithYourWallet Privacy Team
            {'\n'}[Your Business Address]
            {'\n\n'}For EU users: You also have the right to lodge a complaint with your local data protection authority.
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              We are committed to protecting your privacy and being transparent about our data practices. 
              Thank you for trusting VoteWithYourWallet with your information.
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
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700' as const,
    color: Colors.gray[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  introText: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.relaxed,
    color: Colors.gray[700],
    marginBottom: 24,
    backgroundColor: Colors.gray[50],
    padding: 16,
    borderRadius: 8,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600' as const,
    color: Colors.gray[900],
    marginTop: 24,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500' as const,
    color: Colors.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.relaxed,
    color: Colors.gray[700],
    marginBottom: 16,
  },
  bold: {
    fontWeight: '600' as const,
  },
  footer: {
    backgroundColor: Colors.primary[100],
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[800],
    textAlign: 'center',
    fontWeight: '500' as const,
  },
});
