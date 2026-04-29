import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import TopBar from '../components/TopBar';

export default function TermsAndConditions({ navigation }) {
  return (
    <View style={styles.container}>
      <TopBar title="Terms & Conditions" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.updateDate}>Last Updated: April 19, 2026</Text>
        
        <Text style={styles.paragraph}>
          Please read these Terms and Conditions ("Terms") carefully before using the NeextApp mobile application and website (the "Service") operated by NeextApp ("us", "we", or "our").
        </Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
        </Text>

        <Text style={styles.heading}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          NeextApp is a healthcare appointment booking and management platform that connects patients with healthcare providers. The Service includes:{'\n\n'}
          • Patient registration and profile management{'\n'}
          • Doctor registration and profile management{'\n'}
          • Appointment booking and scheduling{'\n'}
          • Medical prescription management{'\n'}
          • Push notifications for appointment reminders{'\n'}
          • Medical history and vital records tracking{'\n'}
          • Doctor search by location and specialization
        </Text>

        <Text style={styles.heading}>3. User Accounts and Registration</Text>
        <Text style={styles.subheading}>3.1 Account Creation</Text>
        <Text style={styles.paragraph}>
          • You must provide accurate, current, and complete information during registration{'\n'}
          • You must be at least 18 years old to create an account, or have parental/guardian consent{'\n'}
          • You are responsible for maintaining the confidentiality of your account credentials{'\n'}
          • You must immediately notify us of any unauthorized use of your account
        </Text>

        <Text style={styles.subheading}>3.2 Types of Accounts</Text>
        <Text style={styles.paragraph}>
          • Patient Account: For individuals seeking medical consultations{'\n'}
          • Doctor Account: For licensed medical practitioners providing healthcare services
        </Text>

        <Text style={styles.heading}>4. Medical Disclaimer</Text>
        <Text style={styles.paragraph}>
          NeextApp is a PLATFORM ONLY. We do not provide medical advice, diagnosis, or treatment. We do not employ or control healthcare providers. All medical decisions and advice come from the healthcare provider, not NeextApp.
        </Text>

        <Text style={styles.warningBox}>
          ⚠️ DO NOT use this Service for medical emergencies. In case of emergency, call your local emergency services immediately (e.g., 112 in India, 911 in US).
        </Text>

        <Text style={styles.heading}>5. Privacy and Data Protection</Text>
        <Text style={styles.paragraph}>
          We collect and process personal information as described in our Privacy Policy. Your data is protected with industry-standard security measures and encryption.
        </Text>

        <Text style={styles.heading}>6. User Conduct</Text>
        <Text style={styles.paragraph}>
          You agree NOT to:{'\n\n'}
          • Provide false or misleading information{'\n'}
          • Impersonate another person or entity{'\n'}
          • Use the Service for any illegal purpose{'\n'}
          • Interfere with the Service's security{'\n'}
          • Harass, abuse, or harm other users{'\n'}
          • Violate any applicable laws or regulations
        </Text>

        <Text style={styles.heading}>7. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          NeextApp shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service.
        </Text>

        <Text style={styles.heading}>8. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms at any time. We will notify users of any material changes. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
        </Text>

        <Text style={styles.heading}>9. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about these Terms, please contact us at:{'\n\n'}
          Email: support@neextapp.com{'\n'}
          Website: https://neextapp.com
        </Text>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  updateDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 24,
    marginBottom: 12,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 22,
    marginBottom: 12,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    padding: 16,
    marginVertical: 16,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  bottomSpace: {
    height: 40,
  },
});
