import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import TopBar from '../components/TopBar';

export default function TermsAndConditions({ navigation }) {
  return (
    <View style={styles.container}>
      <TopBar title="Terms & Conditions" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.updateDate}>Last Updated: July 14, 2026 · Version 1.2</Text>

        <View style={styles.dpdpBanner}>
          <Text style={styles.dpdpBannerText}>
            🛡️ These Terms are drafted in compliance with India's Digital Personal Data Protection
            (DPDP) Act, 2023 and applicable healthcare regulations.
          </Text>
        </View>

        <Text style={styles.paragraph}>
          Please read these Terms and Conditions ("Terms") carefully before using the kedulz mobile
          application and website (the "Service") operated by kedulz ("us", "we", or "our").
        </Text>

        <Text style={styles.heading}>0. Roles Under the DPDP Act</Text>
        <Text style={styles.paragraph}>
          kedulz acts as a <Text style={styles.bold}>Data Fiduciary</Text>. Users are <Text style={styles.bold}>Data Principals</Text>. Third-party
          infrastructure/messaging partners are <Text style={styles.bold}>Data Processors</Text> acting under contract.
          kedulz remains responsible for processor compliance as required by law.
        </Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By creating an account or using the Service, you confirm that you have read, understood,
          and agree to be bound by these Terms and our Privacy Policy.{'\n\n'}
          Acceptance does <Text style={styles.bold}>NOT</Text> constitute blanket consent to the collection and processing of
          your medical data. Consent to each category of medical data is collected separately
          through our granular consent framework at registration and whenever medical data is
          submitted — in compliance with the DPDP Act, 2023 (§6).{'\n\n'}
          If you disagree with any part of these Terms, you may not access the Service.
        </Text>

        <Text style={styles.heading}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          kedulz is a healthcare appointment booking and management platform connecting patients
          with healthcare providers. The Service includes:{'\n\n'}
          • Patient registration and profile management{'\n'}
          • Doctor registration and profile management{'\n'}
          • Appointment booking and scheduling{'\n'}
          • Digital prescription generation and secure storage{'\n'}
          • Push notifications for appointment reminders (with consent){'\n'}
          • Personal health tracking (vitals, conditions, medications){'\n'}
          • Doctor search by location and specialization
        </Text>

        <Text style={styles.heading}>3. User Accounts & Registration</Text>
        <Text style={styles.subheading}>3.1 Account Creation</Text>
        <Text style={styles.paragraph}>
          • You must provide accurate, current, and complete information during registration{'\n'}
          • You must be at least 18 years old, or have verifiable parental/guardian consent{'\n'}
          • You are responsible for maintaining the confidentiality of your login PIN{'\n'}
          • Notify us immediately at support@kedulz.com of any unauthorised account use
        </Text>

        <Text style={styles.subheading}>3.2 Login PIN and Security</Text>
        <Text style={styles.paragraph}>
          Your login PIN is bcrypt-hashed before storage. It is never readable by kedulz, our
          staff, or any third party. You have sole control over your PIN. If you forget your PIN,
          you must complete identity re-verification. kedulz has no ability to retrieve or reset it.
        </Text>

        <Text style={styles.heading}>4. Medical Data Consent (DPDP Act Compliance)</Text>

        <Text style={styles.subheading}>4.1 Granular Consent Requirement</Text>
        <Text style={styles.paragraph}>
          Under the DPDP Act §6, we collect your sensitive medical data ONLY on the basis of your
          free, specific, informed, unconditional, and unambiguous consent, given through clear
          affirmative action. This means:{'\n\n'}
          • All consent checkboxes are <Text style={styles.bold}>unchecked by default</Text>{'\n'}
          • You consent <Text style={styles.bold}>separately</Text> to each category:{'\n'}
          {'  '}☐ Storing health vitals and medical conditions{'\n'}
          {'  '}☐ Sharing medical profile with your treating doctor{'\n'}
          {'  '}☐ Storing digital prescriptions{'\n'}
          {'  '}☐ Receiving appointment push notifications{'\n'}
          {'  '}☐ Anonymised usage analytics{'\n'}
          • GPS/location for "find nearby doctors" is processed as necessity-based core
            functionality when you use that feature and is not persistently stored{'\n'}
          • We collect only data reasonably necessary for the stated healthcare purpose{'\n'}
          • Mandatory categories (★) are required to use core appointment and health features{'\n'}
          • Optional categories can be declined without losing access to basic functions
        </Text>

        <Text style={styles.subheading}>4.2 Right to Withdraw Consent</Text>
        <Text style={styles.paragraph}>
          You may withdraw any consent at any time from{' '}
          <Text style={styles.bold}>Profile → Manage My Data</Text>. Withdrawing consent is as easy
          as giving it. Withdrawal does not affect the lawfulness of processing before withdrawal,
          but will disable the corresponding feature going forward.
        </Text>

        <Text style={styles.subheading}>4.3 Data Use Limitation</Text>
        <Text style={styles.paragraph}>
          Your medical data will be used ONLY for the specific purpose stated in the consent notice
          and our Privacy Policy. We will not use your diagnostic data for advertising, insurance
          profiling, employer screening, or any undisclosed purpose.
        </Text>

        <Text style={styles.subheading}>4.4 DPDP Notice at Collection (Section 5)</Text>
        <Text style={styles.paragraph}>
          Before or at consent collection, kedulz provides notice covering data categories,
          processing purpose, rights (access/correction/erasure), withdrawal process, and grievance
          escalation path to the Data Protection Board of India.
        </Text>

        <Text style={styles.heading}>5. Your Control Over Your Data (DPDP Act §11–13)</Text>
        <Text style={styles.paragraph}>
          You have the right to:{'\n\n'}
          • <Text style={styles.bold}>Access</Text> all personal and medical information we hold about you{'\n'}
          • <Text style={styles.bold}>Correct</Text> any inaccurate data at any time{'\n'}
          • <Text style={styles.bold}>Erase</Text> your health data or entire account from Profile → Manage My Data{'\n'}
          • <Text style={styles.bold}>Withdraw consent</Text> for any data processing category{'\n'}
          • <Text style={styles.bold}>Know sharing parties</Text> for a specific purpose by requesting the identity of all
            parties with whom your personal data has been shared{'\n'}
          • <Text style={styles.bold}>Nominate</Text> a trusted person to exercise these rights on your behalf{'\n'}
          • <Text style={styles.bold}>Lodge a complaint</Text> with our Grievance Officer or the Data Protection Board of India{'\n\n'}
          Note: Conservative retention policy: finalized prescriptions may be retained for up to
          7 years for continuity, audit, and legal defense needs, and then anonymised/deleted
          per policy controls.
        </Text>

        <Text style={styles.subheading}>5.1 Nomination (Death / Incapacity)</Text>
        <Text style={styles.paragraph}>
          You may nominate a trusted person to exercise your data rights if you die or become
          incapacitated. Nomination requests require user identity verification and nominee details,
          and may require supporting documentation before activation.
        </Text>

        <Text style={styles.heading}>6. Appointments & Medical Information Sharing</Text>
        <Text style={styles.paragraph}>
          When you book an appointment, your medical profile (vitals, history, medications,
          allergies) is shared with the specific doctor you booked, solely for that consultation.
          This is done only with your explicit consent (DIAGNOSTIC_SHARING). The information is
          not shared with any other doctor or third party without your further action.
        </Text>

        <Text style={styles.heading}>7. Prescriptions</Text>
        <Text style={styles.paragraph}>
          Prescriptions are generated in real time by your treating doctor and are stored securely
          in our database. A prescription is a private medical record shared only between you and
          the issuing doctor. kedulz does not use prescription content for any purpose other than
          storing and delivering it to you.
        </Text>

        <Text style={styles.heading}>8. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement the following safeguards:{'\n\n'}
          • AES-256 application-level encryption for sensitive medical information stored in
            encrypted fields at rest{'\n'}
          • TLS 1.3 for all data in transit{'\n'}
          • bcrypt-hashed login PINs (never readable){'\n'}
          • Role-based access control (RBAC){'\n'}
          • India-hosted servers compliant with applicable data localisation requirements{'\n'}
          • Regular security audits and vulnerability management
        </Text>

        <Text style={styles.heading}>9. Personal Data Breach Notification</Text>
        <Text style={styles.paragraph}>
          If a personal data breach is confirmed, kedulz will notify the Data Protection Board of
          India without delay, submit a detailed incident report within 72 hours of confirmation,
          and notify affected users without delay. Notifications include impact details,
          mitigation steps, and recommended user actions. This breach timeline is separate from
          grievance-response timelines.
        </Text>

        <Text style={styles.heading}>10. Data Retention, Erasure & Withdrawal Effect</Text>
        <Text style={styles.paragraph}>
          We erase personal data once consent is withdrawn or the stated purpose is served, unless
          retention is required by law. Some medical records (such as finalized prescriptions) may
          be retained for statutory compliance and then anonymised/deleted per policy.
        </Text>

        <Text style={styles.heading}>11. Legitimate Use in Medical Emergencies (Section 7)</Text>
        <Text style={styles.paragraph}>
          In emergencies threatening life or health, limited processing may occur without prior
          consent where law permits. This exception is for emergency response only and not for
          routine processing.
        </Text>

        <Text style={styles.heading}>12. Medical Disclaimer</Text>
        <Text style={styles.paragraph}>
          kedulz is a platform only. We do not provide medical advice, diagnosis, or treatment. We
          do not employ or control healthcare providers. All medical decisions, advice, and
          prescriptions come from the healthcare provider, not kedulz.
        </Text>
        <Text style={styles.warningBox}>
          ⚠️ DO NOT use this Service for medical emergencies. In case of emergency, call
          emergency services immediately (112 in India).
        </Text>

        <Text style={styles.heading}>13. Data Protection & Grievance Contact (DPDP Act §13)</Text>
        <View style={styles.grievanceBox}>
          <Text style={styles.grievanceText}>
            <Text style={styles.bold}>Data Protection & Grievance Officer:</Text> kedulz Privacy Officer{'\n'}
            <Text style={styles.bold}>Email:</Text> privacy@kedulz.com{'\n'}
            <Text style={styles.bold}>Response time:</Text> Within 72 hours (business days){'\n'}
            <Text style={styles.bold}>Support:</Text> support@kedulz.com{'\n'}
            <Text style={styles.bold}>Escalation:</Text> Data Protection Board of India{'\n'}
            <Text style={styles.bold}>Website:</Text> https://kedulz.com
          </Text>
        </View>

        <Text style={styles.heading}>14. User Conduct</Text>
        <Text style={styles.paragraph}>
          You agree NOT to:{'\n\n'}
          • Provide false or misleading information{'\n'}
          • Impersonate another person or entity{'\n'}
          • Use the Service for any illegal purpose{'\n'}
          • Attempt to bypass security, encryption, or access controls{'\n'}
          • Harass, abuse, or harm other users{'\n'}
          • Violate any applicable Indian law or regulation
        </Text>

        <Text style={styles.heading}>15. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          kedulz shall not be liable for any indirect, incidental, or consequential damages arising
          from your use of the Service, including any damages arising from medical advice, diagnosis,
          or treatment provided by a healthcare provider through the platform.
        </Text>

        <Text style={styles.heading}>16. Cross-Border Transfer & Data Hosting</Text>
        <Text style={styles.paragraph}>
          Primary production data is hosted in India. Where cross-border transfer is required for
          backup, support, or sub-processing, it is restricted to jurisdictions not prohibited by
          Government of India notification and protected by contractual and technical safeguards.
        </Text>

        <Text style={styles.heading}>17. Changes to These Terms</Text>
        <Text style={styles.paragraph}>
          We may update these Terms. Material changes will be notified through the app and by
          updating the "Last Updated" date. Continued use after notification constitutes acceptance.
        </Text>

        <Text style={styles.heading}>18. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms are governed by the laws of India. Any disputes shall be subject to the
          exclusive jurisdiction of courts in India. These Terms comply with the Digital Personal
          Data Protection Act, 2023, the Information Technology Act, 2000 (amended), and applicable
          National Medical Commission guidelines.
        </Text>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  updateDate: { fontSize: 12, color: '#7f8c8d', marginBottom: 10, fontStyle: 'italic' },
  dpdpBanner: {
    backgroundColor: '#EBF5FB',
    borderLeftWidth: 4,
    borderLeftColor: '#2980B9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dpdpBannerText: { fontSize: 13, fontWeight: '700', color: '#1a5276' },
  heading: { fontSize: 17, fontWeight: '700', color: '#2c3e50', marginTop: 24, marginBottom: 10 },
  subheading: { fontSize: 15, fontWeight: '600', color: '#34495e', marginTop: 14, marginBottom: 6 },
  paragraph: { fontSize: 14, color: '#2c3e50', lineHeight: 22, marginBottom: 10 },
  bold: { fontWeight: '700' },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    padding: 14,
    marginVertical: 12,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#856404',
    lineHeight: 20,
  },
  grievanceBox: {
    backgroundColor: '#f0f4f8',
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2c3e50',
    marginBottom: 12,
  },
  grievanceText: { fontSize: 14, color: '#2c3e50', lineHeight: 24 },
  bottomSpace: { height: 40 },
});
