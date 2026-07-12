import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import TopBar from '../components/TopBar';

export default function TermsAndConditions({ navigation }) {
  return (
    <View style={styles.container}>
      <TopBar title="Terms & Conditions" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.updateDate}>Last Updated: July 12, 2026</Text>

        <Text style={styles.paragraph}>
          Please read these Terms and Conditions ("Terms") carefully before using the kedulz mobile application and website (the "Service") operated by kedulz ("us", "we", or "our").
        </Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By creating an account, tapping "I Agree", or otherwise accessing or using the Service, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. This also constitutes your explicit consent to the collection, storage, and use of your personal and medical information as described in our Privacy Policy. If you disagree with any part of these Terms, you may not access the Service.
        </Text>

        <Text style={styles.heading}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          kedulz is a healthcare appointment booking and management platform that connects patients with healthcare providers. The Service includes:{'\n\n'}
          • Patient registration and profile management{'\n'}
          • Doctor registration and profile management{'\n'}
          • Appointment booking and scheduling{'\n'}
          • Digital prescription generation and management{'\n'}
          • Push notifications for appointment reminders{'\n'}
          • Medical history and vital records tracking{'\n'}
          • Doctor search by location and specialization
        </Text>

        <Text style={styles.heading}>3. User Accounts and Registration</Text>
        <Text style={styles.subheading}>3.1 Account Creation</Text>
        <Text style={styles.paragraph}>
          • You must provide accurate, current, and complete information during registration{'\n'}
          • You must be at least 18 years old to create an account, or have parental/guardian consent{'\n'}
          • You are responsible for maintaining the confidentiality of your login PIN and account credentials{'\n'}
          • You must immediately notify us of any unauthorized use of your account
        </Text>

        <Text style={styles.subheading}>3.2 Types of Accounts</Text>
        <Text style={styles.paragraph}>
          • Patient Account: For individuals seeking medical consultations{'\n'}
          • Doctor Account: For licensed medical practitioners providing healthcare services
        </Text>

        <Text style={styles.subheading}>3.3 Login PIN and Account Security</Text>
        <Text style={styles.paragraph}>
          Every account (patient or doctor) is secured with a login PIN set by you. Your PIN is end-to-end encrypted — it is never visible to kedulz, our staff, or any third party, and cannot be viewed or reset by us on your behalf. You have sole and full control over your PIN, and you are solely responsible for keeping it confidential. If you forget your PIN, you will need to complete identity re-verification to regain access, since we have no way to retrieve or view it.
        </Text>

        <Text style={styles.heading}>4. Your Control Over Your Data</Text>
        <Text style={styles.paragraph}>
          You remain in control of the information you provide to kedulz at all times. You may view, edit, correct, or delete your personal and medical information from within the app at any time, except for records that are required to be retained by law (such as finalized prescriptions and appointment records, as explained in our Privacy Policy).
        </Text>

        <Text style={styles.heading}>5. Appointments and Information Shared with Doctors</Text>
        <Text style={styles.paragraph}>
          When you book an appointment, relevant medical information from your profile (such as vitals, medical history, current medications, and allergies) is shared with the specific doctor you have booked, so that they can triage and consult you accurately and safely. This information is shared only with the doctor(s) involved in your care and only for the purpose of that consultation. It is not shared with any other party, doctor, or third party without your action or consent.
        </Text>

        <Text style={styles.heading}>6. Prescriptions</Text>
        <Text style={styles.paragraph}>
          Prescriptions issued through kedulz are generated in real time by the treating doctor and are a private medical record strictly between you and that doctor. Prescriptions are stored in our secure database for your records and future reference and are accessible to you and the issuing doctor. kedulz does not use prescription content for any purpose other than storing and delivering it to you, and does not share it with any other party except as required by law.
        </Text>

        <Text style={styles.heading}>7. Medical Disclaimer</Text>
        <Text style={styles.paragraph}>
          kedulz is a PLATFORM ONLY. We do not provide medical advice, diagnosis, or treatment. We do not employ or control healthcare providers. All medical decisions, advice, and prescriptions come from the healthcare provider, not kedulz.
        </Text>

        <Text style={styles.warningBox}>
          ⚠️ DO NOT use this Service for medical emergencies. In case of emergency, call your local emergency services immediately (e.g., 112 in India, 911 in US).
        </Text>

        <Text style={styles.heading}>8. Privacy and Data Protection</Text>
        <Text style={styles.paragraph}>
          We collect and process personal and medical information as described in our Privacy Policy. All data is stored in a secure, encrypted database, and your login PIN is end-to-end encrypted. We do not sell or share your personal information with third parties for marketing or any other purpose.
        </Text>

        <Text style={styles.heading}>9. User Conduct</Text>
        <Text style={styles.paragraph}>
          You agree NOT to:{'\n\n'}
          • Provide false or misleading information{'\n'}
          • Impersonate another person or entity{'\n'}
          • Use the Service for any illegal purpose{'\n'}
          • Attempt to bypass, disable, or interfere with the Service's security or encryption{'\n'}
          • Harass, abuse, or harm other users{'\n'}
          • Violate any applicable laws or regulations
        </Text>

        <Text style={styles.heading}>10. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          kedulz shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service, including any damages arising from medical advice, diagnosis, or treatment provided by a doctor through the platform.
        </Text>

        <Text style={styles.heading}>11. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms at any time. We will notify users of any material changes through the app or via email. Your continued use of the Service after such changes constitutes acceptance of the modified Terms.
        </Text>

        <Text style={styles.heading}>12. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about these Terms, please contact us at:{'\n\n'}
          Email: support@kedulz.com{'\n'}
          Website: https://kedulz.com
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
