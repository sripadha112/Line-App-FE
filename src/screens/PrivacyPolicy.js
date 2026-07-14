import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import TopBar from '../components/TopBar';

export default function PrivacyPolicy({ navigation }) {
  return (
    <View style={styles.container}>
      <TopBar title="Privacy Policy" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.updateDate}>Last Updated: July 14, 2026 · Policy Version 1.2</Text>

        <View style={styles.dpdpBanner}>
          <Text style={styles.dpdpBannerText}>
            🛡️ This policy complies with India's Digital Personal Data Protection (DPDP) Act, 2023
          </Text>
        </View>

        <Text style={styles.paragraph}>
          kedulz ("we", "us", or "our") is committed to protecting your privacy and complying with
          the Digital Personal Data Protection (DPDP) Act, 2023. This Privacy Policy explains how
          we collect, use, store, share, and protect your personal and medical data, and your rights
          under Indian law.
        </Text>

        <Text style={styles.heading}>0. Our Role Under the DPDP Act</Text>
        <Text style={styles.paragraph}>
          • kedulz is a <Text style={styles.bold}>Data Fiduciary</Text> (we decide purposes and means of processing).{'\n'}
          • You are the <Text style={styles.bold}>Data Principal</Text>.{'\n'}
          • Our cloud, messaging, and infrastructure partners act as <Text style={styles.bold}>Data Processors</Text>. We remain legally
            responsible for ensuring processor compliance through valid contracts and controls.
        </Text>

        <Text style={styles.heading}>0A. DPDP Notice (Section 5)</Text>
        <Text style={styles.paragraph}>
          Before or at the time of consent, kedulz provides notice describing:{'\n'}
          • what personal data is collected and the specific purpose of collection{'\n'}
          • how to access, correct, complete, or erase your data{'\n'}
          • how to withdraw consent{'\n'}
          • how to file a grievance and escalate to the Data Protection Board of India{'\n'}
          • language availability (English and additional Indian language support as rolled out)
        </Text>

        <Text style={styles.heading}>1. Categories of Personal Data We Collect</Text>
        <Text style={styles.subheading}>1.1 Identity & Contact Data (All Users)</Text>
        <Text style={styles.paragraph}>
          • Full name, date of birth, age, gender{'\n'}
          • Mobile number, email address{'\n'}
          • Address, city, state, PIN code, country{'\n'}
          • Login PIN (bcrypt-hashed – never readable by kedulz or any third party)
        </Text>

        <Text style={styles.subheading}>1.2 Sensitive Medical Data (Patients Only)</Text>
        <Text style={styles.paragraph}>
          The following health data is classified as{' '}
          <Text style={styles.bold}>sensitive personal data</Text> under the DPDP Act and is
          collected only with your explicit, granular, category-specific consent:{'\n\n'}
          • Vital signs: height, weight, BMI, blood pressure, heart rate, blood oxygen, blood sugar,
            body temperature{'\n'}
          • Blood group and Rh factor{'\n'}
          • Medical conditions: diabetes, hypertension, heart/kidney/liver disease{'\n'}
          • Current medications and dosages{'\n'}
          • Known drug and food allergies{'\n'}
          • Chronic diseases, surgical history, vaccination records{'\n'}
          • Family medical history{'\n'}
          • Digital prescriptions from treating doctors{'\n'}
          • Doctor's medical notes and consultation summaries{'\n'}
          • Emergency contact details
        </Text>

        <Text style={styles.subheading}>1.3 Doctor Professional Data</Text>
        <Text style={styles.paragraph}>
          • Medical registration/license number, specialization, designation{'\n'}
          • Workplace details (name, address, consultation hours){'\n'}
          • Appointment records and availability schedule
        </Text>

        <Text style={styles.subheading}>1.4 Automatically Collected Data</Text>
        <Text style={styles.paragraph}>
          • Device type, model, OS version{'\n'}
          • Unique device identifiers and FCM push tokens{'\n'}
          • Anonymised usage patterns (no medical data){'\n'}
          • GPS location (only when searching nearby doctors – never stored persistently){'\n'}
          • Error logs and crash reports (auto-purged after 90 days)
        </Text>

        <Text style={styles.heading}>2. Purpose Limitation</Text>
        <Text style={styles.paragraph}>
          Each category of data is used only for the explicit purpose stated below:
        </Text>
        <View style={styles.purposeTable}>
          {[
            ['Medical vitals & conditions', 'Generate personal health summaries inside the app; shared with your treating doctor to enable safe triage and consultation.'],
            ['Prescriptions', 'Store and deliver digital prescriptions. Shared only between you and the issuing doctor. Never used for any other purpose.'],
            ['Contact information', 'Account management, appointment notifications, and responding to support requests.'],
            ['Location data', 'Find nearby doctors when you search. Not stored permanently.'],
            ['FCM device token', 'Deliver appointment push notifications only (requires your consent).'],
            ['Anonymised analytics', 'Improve app performance and features. No medical or identifiable data included.'],
          ].map(([category, purpose], i) => (
            <View key={i} style={styles.purposeRow}>
              <Text style={styles.purposeCategory}>{category}</Text>
              <Text style={styles.purposeText}>{purpose}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.warningBox}>
          ⚠️ Your diagnostic data is collected SOLELY to generate health summaries inside the app
          and to support your treating doctor. It will NOT be used for third-party advertising,
          insurance profiling, employer screening, or any undisclosed purpose.
        </Text>

        <Text style={styles.heading}>3. Consent Framework (DPDP Act §6)</Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.bold}>Valid consent standard:</Text> Consent is free, specific, informed, unconditional, unambiguous,
            and obtained through clear affirmative action{'\n'}
          • <Text style={styles.bold}>No pre-ticked boxes</Text> – All consent checkboxes are unchecked by default{'\n'}
          • <Text style={styles.bold}>Granular consent</Text> – You consent separately to each data category (storage,
            sharing, prescriptions, notifications, analytics){'\n'}
          • <Text style={styles.bold}>Necessity limitation</Text> – We request only data reasonably necessary for the stated
            healthcare purpose (no unrelated over-collection){'\n'}
          • <Text style={styles.bold}>Location processing basis</Text> – GPS/location is processed as necessity-based core
            functionality only when you use "find nearby doctors" and is not persistently stored{'\n'}
          • <Text style={styles.bold}>Just-In-Time notice</Text> – A layered consent popup is shown before any medical
            data is submitted{'\n'}
          • <Text style={styles.bold}>Right to withdraw</Text> – Withdraw any consent anytime from Profile → Manage My
            Data. Withdrawal is as easy as giving consent.{'\n'}
          • <Text style={styles.bold}>Audit trail</Text> – Every consent decision is timestamped and stored for compliance
        </Text>

        <Text style={styles.heading}>4. Information Sharing & Third-Party Vendors</Text>
        <Text style={styles.paragraph}>
          We do <Text style={styles.bold}>NOT</Text> sell, rent, or trade your personal or medical data.{'\n\n'}
          Data is shared only in these limited circumstances:{'\n\n'}
          <Text style={styles.bold}>Treating doctor:</Text> Your medical profile is shared with the specific doctor you book,
          only for that consultation.{'\n\n'}
          <Text style={styles.bold}>Cloud / Hosting (Render.com, Supabase/PostgreSQL):</Text> Infrastructure providers that
          store your data under strict data-processing agreements. They cannot access your data for
          their own purposes.{'\n\n'}
          <Text style={styles.bold}>Firebase (Google):</Text> Used only to deliver push notifications. Does not access medical
          data.{'\n\n'}
          <Text style={styles.bold}>Legal requirements:</Text> Where required by Indian law, court order, or lawful authority.{'\n\n'}
          <Text style={styles.bold}>With explicit consent:</Text> For any other purpose, we seek separate specific consent first.
        </Text>
        <Text style={styles.paragraph}>
          We execute contractual controls with processors covering confidentiality, security,
          purpose limitation, incident reporting, and deletion/return of data on termination.
        </Text>
        <Text style={styles.paragraph}>
          You may request the identity of all parties with whom your personal data has been shared
          for a specified processing purpose by writing to privacy@kedulz.com.
        </Text>

        <Text style={styles.heading}>5. Data Security (DPDP Act §8)</Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.bold}>Encryption at rest:</Text> AES-256 application-level encryption is applied to
            sensitive medical information stored in encrypted fields, including prescription/medical
            notes, medications, allergies, chronic diseases, surgeries, vaccinations, and family
            medical history{'\n'}
          • <Text style={styles.bold}>Encryption in transit:</Text> TLS 1.3 for all data between your device and our servers{'\n'}
          • <Text style={styles.bold}>Login PIN:</Text> bcrypt-hashed – never readable by kedulz or any third party{'\n'}
          • <Text style={styles.bold}>Role-based access control (RBAC):</Text> Doctors can only access data of patients who
            actively booked with them{'\n'}
          • <Text style={styles.bold}>Server location:</Text> India-hosted data centres compliant with local data localisation
            requirements{'\n'}
          • <Text style={styles.bold}>Monitoring:</Text> Access logs, audit trails, and intrusion detection systems{'\n'}
          • <Text style={styles.bold}>Vulnerability management:</Text> Regular security reviews and patch management
        </Text>
        <Text style={styles.warningBox}>
          ⚠️ No internet transmission is 100% secure. If you believe your account has been
          compromised, contact privacy@kedulz.com immediately.
        </Text>

        <Text style={styles.heading}>6. Personal Data Breach Notification</Text>
        <Text style={styles.paragraph}>
          If a personal data breach is confirmed, kedulz will notify the Data Protection Board of
          India <Text style={styles.bold}>without delay</Text>, submit a <Text style={styles.bold}>detailed incident report within 72 hours</Text>
          of confirmation, and notify all affected users <Text style={styles.bold}>without delay</Text>.{'\n\n'}
          Notifications include breach nature, likely impact, mitigation steps, and actions you
          should take. This breach timeline is separate from grievance-response timelines.
        </Text>

        <Text style={styles.heading}>7. Data Retention & Erasure</Text>
        <Text style={styles.paragraph}>
          We erase personal data once consent is withdrawn or the specified purpose is served,
          unless retention is required by law, regulation, or legal defense obligations.
        </Text>
        <View style={styles.purposeTable}>
          {[
            ['Medical vitals & conditions', 'Retained while account is active; erased within 30 days of deletion request.'],
            ['Prescriptions', 'Conservative retention policy: up to 7 years from issue date for continuity, audit, and legal defense needs. Account deletion anonymises data where feasible.'],
            ['Appointment records', '3 years for operations and dispute resolution.'],
            ['Consent records', 'Indefinitely retained as a compliance audit trail.'],
            ['FCM push tokens', 'Deleted within 24 hours of consent withdrawal or logout.'],
            ['Error logs & analytics', 'Auto-purged after 90 days.'],
          ].map(([type, period], i) => (
            <View key={i} style={styles.purposeRow}>
              <Text style={styles.purposeCategory}>{type}</Text>
              <Text style={styles.purposeText}>{period}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.heading}>8. Your Rights Under the DPDP Act 2023</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Right to Access:</Text> View all data we hold — Profile → View Profile{'\n\n'}
          <Text style={styles.bold}>Right to Correction:</Text> Correct inaccurate data — Profile → Edit Profile{'\n\n'}
          <Text style={styles.bold}>Right to Erasure:</Text> Delete health data or entire account — Profile → Manage My Data{'\n\n'}
          <Text style={styles.bold}>Right to Withdraw Consent:</Text> Profile → Manage My Data → toggle any consent off{'\n\n'}
          <Text style={styles.bold}>Right to Grievance Redressal:</Text> Contact our Grievance Officer (Section 14) or the
          Data Protection Board of India{'\n\n'}
          <Text style={styles.bold}>Right to Nominate:</Text> Nominate a trusted person to exercise rights on your behalf —
          use Profile → Manage My Data → Nominee Request or email privacy@kedulz.com
        </Text>

        <Text style={styles.subheading}>8.1 Nomination Request Process (Death / Incapacity)</Text>
        <Text style={styles.paragraph}>
          To register, update, or revoke a nominee, we require identity verification of the user
          and nominee details. In case of death/incapacity claims, supporting legal/medical
          documentation may be required before rights are enabled for the nominee.
        </Text>

        <Text style={styles.heading}>9. Prescriptions</Text>
        <Text style={styles.paragraph}>
          Prescriptions are generated by your treating doctor in real time. They are a private
          medical record shared exclusively between you and the issuing doctor. kedulz stores them
          solely to make them accessible to you; we do not use prescription content for any other
          purpose.
        </Text>

        <Text style={styles.heading}>10. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our Service is not intended for users under 18 without verifiable parental consent. If
          you believe your child's data was collected without consent, contact privacy@kedulz.com.
          We may require guardian identity and relationship proof to verify consent requests.
          kedulz does not permit targeted advertising or behavioural tracking for children.
        </Text>

        <Text style={styles.heading}>11. Medical Emergency Processing (Legitimate Use)</Text>
        <Text style={styles.paragraph}>
          In a medical emergency threatening life or health, limited data processing may occur
          without prior consent where permitted by DPDP Act Section 7. This exception is used only
          for emergency response and not for general processing.
        </Text>

        <Text style={styles.heading}>12. Cross-Border Data Transfer (Section 16)</Text>
        <Text style={styles.paragraph}>
          Primary production data is hosted in India. If any backup, support, or sub-processor
          transfer occurs outside India, transfers are limited to jurisdictions not restricted under
          applicable Government of India notifications, with contractual and technical safeguards.
        </Text>

        <Text style={styles.heading}>13. Significant Data Fiduciary</Text>
        <Text style={styles.paragraph}>
          If MeitY designates kedulz as a Significant Data Fiduciary (SDF), we will comply with all
          additional DPDP Act obligations, including annual data protection audits and appointment
          of an independent Data Protection Officer. Users will be notified.
        </Text>

        <Text style={styles.heading}>14. Data Protection & Grievance Contact (Mandatory Disclosure)</Text>
        <View style={styles.grievanceBox}>
          <Text style={styles.grievanceText}>
            <Text style={styles.bold}>Data Protection & Grievance Officer:</Text> kedulz Privacy Officer{'\n'}
            <Text style={styles.bold}>Email:</Text> privacy@kedulz.com{'\n'}
            <Text style={styles.bold}>Response time:</Text> Within 72 hours (business days){'\n'}
            <Text style={styles.bold}>Escalation:</Text> Data Protection Board of India (if unresolved){'\n'}
            <Text style={styles.bold}>Website:</Text> https://kedulz.com{'\n'}
            <Text style={styles.bold}>Address:</Text> kedulz, India
          </Text>
        </View>

        <Text style={styles.heading}>15. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We will notify you of material changes through the app and by updating the "Last Updated"
          date and version number. Continued use after notification constitutes acceptance.
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
  purposeTable: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  purposeRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  purposeCategory: { fontSize: 13, fontWeight: '700', color: '#2c3e50', marginBottom: 3 },
  purposeText: { fontSize: 12, color: '#555', lineHeight: 18 },
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
