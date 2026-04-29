import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import TopBar from '../components/TopBar';

export default function PrivacyPolicy({ navigation }) {
  return (
    <View style={styles.container}>
      <TopBar title="Privacy Policy" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.updateDate}>Last Updated: April 19, 2026</Text>
        
        <Text style={styles.paragraph}>
          NeextApp ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Please read this Privacy Policy carefully.</Text> By using the Service, you consent to the data practices described in this policy.
        </Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        
        <Text style={styles.subheading}>1.1 Personal Information You Provide</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>For All Users:</Text>{'\n'}
          • Identity Information: Full name, date of birth, age, gender{'\n'}
          • Contact Information: Mobile number, email address{'\n'}
          • Location Information: Address, city, state, PIN code, country{'\n'}
          • Account Credentials: Encrypted authentication tokens
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>For Patients:</Text>{'\n'}
          • Health vital signs (height, weight, blood pressure, heart rate, etc.){'\n'}
          • Blood group and medical conditions{'\n'}
          • Current medications and drug allergies{'\n'}
          • Medical history and family medical history{'\n'}
          • Appointment and prescription information{'\n'}
          • Family member information you choose to add
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>For Doctors:</Text>{'\n'}
          • Medical specialization and designation{'\n'}
          • Medical registration/license number{'\n'}
          • Workplace details (clinic/hospital information){'\n'}
          • Consultation hours and availability
        </Text>

        <Text style={styles.subheading}>1.2 Information Automatically Collected</Text>
        <Text style={styles.paragraph}>
          • Device type, model, and operating system{'\n'}
          • Unique device identifiers{'\n'}
          • App usage data and navigation patterns{'\n'}
          • GPS location (when searching for nearby doctors){'\n'}
          • Push notification device tokens{'\n'}
          • Error logs and crash reports
        </Text>

        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to:{'\n\n'}
          <Text style={styles.bold}>Service Delivery:</Text>{'\n'}
          • Create and manage your account{'\n'}
          • Facilitate appointment booking{'\n'}
          • Enable doctors to view patient medical information{'\n'}
          • Send appointment reminders and updates{'\n'}
          • Generate and store medical prescriptions{'\n\n'}
          <Text style={styles.bold}>Communication:</Text>{'\n'}
          • Send push notifications about appointments{'\n'}
          • Respond to support requests{'\n'}
          • Send service announcements{'\n\n'}
          <Text style={styles.bold}>Improvement:</Text>{'\n'}
          • Analyze usage patterns{'\n'}
          • Fix technical issues{'\n'}
          • Develop new features
        </Text>

        <Text style={styles.heading}>3. Information Sharing and Disclosure</Text>
        <Text style={styles.paragraph}>
          We DO NOT sell your personal information. We may share your information:{'\n\n'}
          • With healthcare providers for appointment purposes{'\n'}
          • With service providers who assist our operations{'\n'}
          • When required by law or legal process{'\n'}
          • To protect rights, property, or safety{'\n'}
          • With your explicit consent
        </Text>

        <Text style={styles.heading}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures:{'\n\n'}
          • Encryption of data in transit and at rest{'\n'}
          • Secure authentication and authorization{'\n'}
          • Regular security audits{'\n'}
          • Access controls and monitoring{'\n'}
          • Secure cloud infrastructure
        </Text>

        <Text style={styles.warningBox}>
          ⚠️ No method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
        </Text>

        <Text style={styles.heading}>5. Your Rights and Choices</Text>
        <Text style={styles.paragraph}>
          You have the right to:{'\n\n'}
          • Access your personal information{'\n'}
          • Update or correct your information{'\n'}
          • Delete your account{'\n'}
          • Opt-out of push notifications{'\n'}
          • Disable location services{'\n'}
          • Withdraw consent (where applicable)
        </Text>

        <Text style={styles.heading}>6. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your information for as long as necessary to provide the Service and comply with legal obligations. When you delete your account, we will delete or anonymize your personal information, except where required by law.
        </Text>

        <Text style={styles.heading}>7. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our Service is not intended for children under 18 without parental consent. We do not knowingly collect information from children under 18. If you believe we have collected such information, please contact us.
        </Text>

        <Text style={styles.heading}>8. Changes to Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last Updated" date and through the Service.
        </Text>

        <Text style={styles.heading}>9. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy, please contact us:{'\n\n'}
          Email: privacy@neextapp.com{'\n'}
          Website: https://neextapp.com{'\n'}
          Address: NeextApp, India
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
  bold: {
    fontWeight: '700',
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
