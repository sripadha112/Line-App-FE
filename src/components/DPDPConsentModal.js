import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

/**
 * DPDPConsentModal – Layer 1 "Just-In-Time" consent notice
 *
 * Shows granular, unchecked-by-default checkboxes before medical data is
 * submitted.  Mandatory consents (MEDICAL_DATA_STORAGE, PRESCRIPTION_STORAGE)
 * must be accepted for the flow to proceed. Optional consents can be skipped.
 *
 * Props:
 *   visible           {boolean}
 *   onAccept(choices) {fn}  – called with array of { consentType, consented }
 *   onDecline()       {fn}  – called when user cancels
 *   context           {string} – 'registration' | 'medical_update'
 */
export default function DPDPConsentModal({ visible, onAccept, onDecline, context = 'registration' }) {
  const CONSENTS = [
    {
      type: 'MEDICAL_DATA_STORAGE',
      title: '🏥 Store My Medical Health Data',
      description:
        'I consent to kedulz securely storing my health vitals (height, weight, blood pressure, etc.), medical conditions, current medications, and allergies. This data is stored exclusively to generate personal health summaries inside the app and is never sold or used for advertising.',
      required: true,
    },
    {
      type: 'DIAGNOSTIC_SHARING',
      title: '👨‍⚕️ Share Data With My Treating Doctor',
      description:
        'I consent to my medical profile being shared with the specific doctor I book an appointment with, solely so they can triage and consult me safely. No other doctor or third party can access this data.',
      required: true,
    },
    {
      type: 'PRESCRIPTION_STORAGE',
      title: '📋 Store My Prescriptions',
      description:
        'I consent to kedulz securely storing digital prescriptions issued by my treating doctor. Prescriptions are a private medical record between me and the issuing doctor and are not shared with any other party.',
      required: true,
    },
    {
      type: 'PUSH_NOTIFICATIONS',
      title: '🔔 Appointment Reminders (Optional)',
      description:
        'I consent to receive push notifications for appointment reminders, cancellations, and service updates. You can withdraw this at any time in app settings.',
      required: false,
    },
    {
      type: 'ANALYTICS',
      title: '📊 Anonymised Usage Analytics (Optional)',
      description:
        'I consent to sharing anonymised, non-identifiable usage patterns to help improve the app. No medical or personal data is included in analytics.',
      required: false,
    },
  ];

  const initialState = CONSENTS.reduce((acc, c) => {
    acc[c.type] = false;
    return acc;
  }, {});

  const [checked, setChecked] = useState(initialState);

  useEffect(() => {
    if (visible) {
      setChecked(initialState);
    }
  }, [visible]);

  const toggle = (type) => setChecked((prev) => ({ ...prev, [type]: !prev[type] }));

  const handleSelectAll = () => {
    const next = CONSENTS.reduce((acc, c) => {
      acc[c.type] = true;
      return acc;
    }, {});
    setChecked(next);
  };

  const mandatoryAllChecked = CONSENTS.filter((c) => c.required).every((c) => checked[c.type]);

  const handleAccept = () => {
    const choices = CONSENTS.map((c) => ({
      consentType: c.type,
      consented: checked[c.type],
    }));
    onAccept(choices);
    // reset for next open
    setChecked(initialState);
  };

  const handleDecline = () => {
    setChecked(initialState);
    onDecline();
  };

  const title =
    context === 'registration'
      ? 'Data Consent – Required Before Registration'
      : 'Data Consent Notice';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDecline}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>
              Under the Digital Personal Data Protection (DPDP) Act, 2023, you must explicitly
              consent to each category of data use. Mandatory items (★) are required to use this
              service.
            </Text>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.bulkActionsRow}>
              <TouchableOpacity style={styles.bulkActionBtn} onPress={handleSelectAll}>
                <Text style={styles.bulkActionBtnText}>Select All</Text>
              </TouchableOpacity>
            </View>

            {CONSENTS.map((c) => (
              <TouchableOpacity
                key={c.type}
                style={[styles.item, checked[c.type] && styles.itemChecked]}
                onPress={() => toggle(c.type)}
                activeOpacity={0.8}
              >
                <View style={styles.itemRow}>
                  <View
                    style={[
                      styles.checkbox,
                      checked[c.type] && styles.checkboxChecked,
                      c.required && !checked[c.type] && styles.checkboxRequired,
                    ]}
                  >
                    {checked[c.type] && <Text style={styles.tick}>✓</Text>}
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>
                      {c.title}
                      {c.required && <Text style={styles.required}> ★</Text>}
                    </Text>
                    <Text style={styles.itemDesc}>{c.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.legalNote}>
              <Text style={styles.legalNoteText}>
                ⚖️ Your rights under the DPDP Act 2023:{'\n'}
                • You may withdraw any consent at any time from Profile → Manage My Data{'\n'}
                • You may request deletion of your health data or full account{'\n'}
                • Grievance Officer: privacy@kedulz.com{'\n'}
                • Data is encrypted at rest (AES-256) and in transit (TLS 1.3)
              </Text>
            </View>
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptBtn, !mandatoryAllChecked && styles.acceptBtnDisabled]}
              onPress={handleAccept}
              disabled={!mandatoryAllChecked}
            >
              <Text style={styles.acceptBtnText}>
                {mandatoryAllChecked ? 'I Agree & Continue' : 'Select Required Items ★'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#EBF5FB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a5276',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#34495e',
    lineHeight: 18,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bulkActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    marginBottom: 4,
  },
  bulkActionBtn: {
    borderWidth: 1,
    borderColor: '#2980B9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  bulkActionBtnText: {
    color: '#2980B9',
    fontSize: 12,
    fontWeight: '700',
  },
  item: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemChecked: {
    backgroundColor: '#EBF5FB',
    borderColor: '#2980B9',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#aaa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#2980B9',
    borderColor: '#2980B9',
  },
  checkboxRequired: {
    borderColor: '#e74c3c',
  },
  tick: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  required: {
    color: '#e74c3c',
    fontWeight: '800',
  },
  itemDesc: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  legalNote: {
    backgroundColor: '#fdf6e3',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    borderRadius: 8,
    padding: 14,
    marginVertical: 12,
  },
  legalNoteText: {
    fontSize: 12,
    color: '#7d5800',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  declineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e74c3c',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  declineBtnText: {
    color: '#e74c3c',
    fontSize: 15,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#2980B9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptBtnDisabled: {
    backgroundColor: '#aaa',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
