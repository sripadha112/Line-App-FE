import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Switch, Linking
} from 'react-native';
import SecureStore from '../utils/secureStorage';
import TopBar from '../components/TopBar';
import { ConsentAPIService, CONSENT_TYPES } from '../services/doctorApiService';
import { showAlert } from '../utils/alertUtils';

const CONSENT_META = [
  {
    type: CONSENT_TYPES.MEDICAL_DATA_STORAGE,
    icon: '🏥',
    label: 'Store Health Vitals & Medical Data',
    description: 'Height, weight, blood pressure, conditions, medications, allergies.',
    required: true,
  },
  {
    type: CONSENT_TYPES.DIAGNOSTIC_SHARING,
    icon: '👨‍⚕️',
    label: 'Share Data With Treating Doctor',
    description: 'Medical profile shared with the specific doctor you book.',
    required: true,
  },
  {
    type: CONSENT_TYPES.PRESCRIPTION_STORAGE,
    icon: '📋',
    label: 'Store Prescriptions',
    description: 'Digital prescriptions stored privately between you and the doctor.',
    required: true,
  },
  {
    type: CONSENT_TYPES.PUSH_NOTIFICATIONS,
    icon: '🔔',
    label: 'Appointment Reminders',
    description: 'Push notifications for appointments and service updates.',
    required: false,
  },
  {
    type: CONSENT_TYPES.ANALYTICS,
    icon: '📊',
    label: 'Anonymised Analytics',
    description: 'Non-identifiable usage patterns to improve the app.',
    required: false,
  },
];

export default function DataRightsScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consentMap, setConsentMap] = useState({});

  useEffect(() => {
    loadConsentStatus();
  }, []);

  const loadConsentStatus = async () => {
    try {
      setLoading(true);
      const uid = await SecureStore.getItemAsync('userId');
      setUserId(uid);
      const status = await ConsentAPIService.getConsentStatus(uid);
      const map = {};
      (status.consents || []).forEach((c) => {
        map[c.consentType] = c.active && c.active === true;
      });
      setConsentMap(map);
    } catch (e) {
      console.log('Error loading consent status:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (type, required) => {
    const currentlyActive = !!consentMap[type];

    if (required) {
      if (currentlyActive) {
        showAlert(
          'Required Consent',
          'This consent is required to use the core features of the app. Withdrawing it will disable medical data storage and sharing with your doctor.',
          [
            { text: 'Keep It', style: 'cancel' },
            {
              text: 'Withdraw Anyway',
              style: 'destructive',
              onPress: () => doWithdraw(type),
            },
          ]
        );
      } else {
        doGrant(type);
      }
    } else {
      if (currentlyActive) {
        doWithdraw(type);
      } else {
        doGrant(type);
      }
    }
  };

  const doGrant = async (type) => {
    try {
      setSaving(true);
      await ConsentAPIService.submitConsents(userId, [{ consentType: type, consented: true }]);
      setConsentMap((prev) => ({ ...prev, [type]: true }));
      showAlert('Done', 'Consent updated successfully.', [{ text: 'Close' }]);
    } catch (e) {
      showAlert('Failed', 'Could not update consent. Please try again.', [{ text: 'Close' }]);
    } finally {
      setSaving(false);
    }
  };

  const doWithdraw = async (type) => {
    try {
      setSaving(true);
      await ConsentAPIService.withdrawConsent(userId, type);
      setConsentMap((prev) => ({ ...prev, [type]: false }));
      showAlert('Done', 'Consent withdrawn successfully.', [{ text: 'Close' }]);
    } catch (e) {
      showAlert('Failed', 'Could not withdraw consent. Please try again.', [{ text: 'Close' }]);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAllConsents = async () => {
    try {
      setSaving(true);
      const all = CONSENT_META.map((meta) => ({ consentType: meta.type, consented: true }));
      await ConsentAPIService.submitConsents(userId, all);
      const nextMap = {};
      CONSENT_META.forEach((meta) => {
        nextMap[meta.type] = true;
      });
      setConsentMap(nextMap);
      showAlert('Done', 'All consent preferences are now active.', [{ text: 'Close' }]);
    } catch (e) {
      showAlert('Failed', 'Could not activate all consents. Please try again.', [{ text: 'Close' }]);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHealthData = () => {
    showAlert(
      'Delete Health Data',
      'This will permanently erase all your health vitals, medical conditions, medications, allergies, prescriptions, and family member records from our servers.\n\nYour account and appointment history will remain. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Health Data',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await ConsentAPIService.deleteHealthData(userId);
              showAlert('Done', 'Your health and medical data has been permanently deleted.', [{ text: 'Close' }]);
              await loadConsentStatus();
            } catch (e) {
              showAlert('Failed', 'Could not delete health data. Please try again or contact privacy@kedulz.com', [{ text: 'Close' }]);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Delete Account',
      'This will permanently delete your entire kedulz account and all associated data (profile, health data, appointments, prescriptions). Your personal data will be anonymised on our servers.\n\nThis action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            showAlert(
              'Final Confirmation',
              'Are you absolutely sure? Your account and all data will be permanently deleted.',
              [
                { text: 'No, Keep My Account', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setSaving(true);
                      await ConsentAPIService.deleteUserAccount(userId);
                      await SecureStore.deleteItemAsync('accessToken');
                      await SecureStore.deleteItemAsync('userId');
                      await SecureStore.deleteItemAsync('role');
                      await SecureStore.deleteItemAsync('fullName');
                      await SecureStore.deleteItemAsync('mobile');
                      showAlert(
                        'Done',
                        'Your account was deleted successfully. Please register again to use kedulz.',
                        [
                          {
                            text: 'Close',
                            onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Auth' }] }),
                          },
                        ],
                        { cancelable: false }
                      );
                    } catch (e) {
                      showAlert('Failed', 'Could not delete account. Please contact privacy@kedulz.com', [{ text: 'Close' }]);
                    } finally {
                      setSaving(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleNomineeRequest = async () => {
    try {
      const subject = 'DPDP Nominee Request - Kedulz';
      const body = `I want to register/update my nominee under DPDP Act Section 14.\n\nUser ID: ${userId || 'N/A'}\nFull Name: \nRegistered Mobile: \n\nNominee Details:\n1) Full Name:\n2) Relationship:\n3) Mobile:\n4) Email:\n5) Address:\n\nPlease share verification steps and required documents.`;
      const mailto = `mailto:privacy@kedulz.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      await Linking.openURL(mailto);
    } catch (e) {
      showAlert('Error', 'Could not open email app. Please write to privacy@kedulz.com');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar title="Manage My Data" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2980B9" />
          <Text style={styles.loadingText}>Loading consent status…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="Manage My Data" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* DPDP Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>🛡️ Your Data Rights – DPDP Act 2023</Text>
          <Text style={styles.bannerText}>
            Under India's Digital Personal Data Protection Act, you have full control over your
            health data. Toggle consents, erase your health records, or delete your account at any
            time. All actions are timestamped for compliance.
          </Text>
        </View>

        {/* Consent Toggles */}
        <Text style={styles.sectionTitle}>Consent Preferences</Text>
        <Text style={styles.sectionSubtitle}>
          Changes are saved immediately. ★ items are required for core functionality.
        </Text>

        <View style={styles.bulkActionsRow}>
          <TouchableOpacity
            style={[styles.bulkActionButton, saving && styles.bulkActionButtonDisabled]}
            onPress={handleSelectAllConsents}
            disabled={saving}
          >
            <Text style={styles.bulkActionButtonText}>Select All</Text>
          </TouchableOpacity>
        </View>

        {CONSENT_META.map((meta) => (
          <View key={meta.type} style={styles.consentCard}>
            <View style={styles.consentRow}>
              <Text style={styles.consentIcon}>{meta.icon}</Text>
              <View style={styles.consentInfo}>
                <Text style={styles.consentLabel}>
                  {meta.label}
                  {meta.required && <Text style={styles.requiredBadge}> ★</Text>}
                </Text>
                <Text style={styles.consentDesc}>{meta.description}</Text>
                <Text style={[styles.statusBadge, consentMap[meta.type] ? styles.statusActive : styles.statusInactive]}>
                  {consentMap[meta.type] ? '● Active' : '○ Withdrawn'}
                </Text>
              </View>
              <Switch
                value={!!consentMap[meta.type]}
                onValueChange={() => handleToggle(meta.type, meta.required)}
                trackColor={{ false: '#ccc', true: '#2980B9' }}
                thumbColor={consentMap[meta.type] ? '#fff' : '#fff'}
                disabled={saving}
              />
            </View>
          </View>
        ))}

        {/* Right to Erasure */}
        <Text style={styles.sectionTitle}>Right to Erasure</Text>
        <Text style={styles.sectionSubtitle}>
          You may erase your health data or delete your account. These actions are permanent.
        </Text>

        <TouchableOpacity style={styles.warningCard} onPress={handleDeleteHealthData} disabled={saving}>
          <Text style={styles.warningIcon}>🗑️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Delete Health & Medical Data</Text>
            <Text style={styles.warningDesc}>
              Erases vitals, conditions, medications, allergies, prescriptions, and family records.
              Your account remains active.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerCard} onPress={handleDeleteAccount} disabled={saving}>
          <Text style={styles.warningIcon}>❌</Text>
          <View style={styles.warningContent}>
            <Text style={styles.dangerTitle}>Delete My Account</Text>
            <Text style={styles.warningDesc}>
              Permanently deletes your account, all personal data, health data, and appointment
              records. This cannot be undone.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Nomination Right */}
        <Text style={styles.sectionTitle}>Nomination Right (Death / Incapacity)</Text>
        <Text style={styles.sectionSubtitle}>
          You can nominate a trusted person to exercise your data rights on your behalf.
        </Text>

        <TouchableOpacity style={styles.nomineeCard} onPress={handleNomineeRequest} disabled={saving}>
          <Text style={styles.warningIcon}>🧾</Text>
          <View style={styles.warningContent}>
            <Text style={styles.nomineeTitle}>Register / Update Nominee</Text>
            <Text style={styles.warningDesc}>
              Submit nominee details and verification documents as required under DPDP.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Grievance Officer */}
        <View style={styles.grievanceCard}>
          <Text style={styles.grievanceTitle}>📬 Grievance Officer</Text>
          <Text style={styles.grievanceText}>
            For any data-related concerns, complaints, or requests:{'\n\n'}
            <Text style={styles.bold}>Email:</Text> privacy@kedulz.com{'\n'}
            <Text style={styles.bold}>Response time:</Text> Within 72 hours{'\n'}
            <Text style={styles.bold}>Escalation:</Text> You may also lodge a complaint with the
            Data Protection Board of India.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.savingText}>Updating…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  scroll: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#555' },

  banner: {
    backgroundColor: '#EBF5FB',
    borderLeftWidth: 4,
    borderLeftColor: '#2980B9',
    margin: 16,
    borderRadius: 10,
    padding: 16,
  },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#1a5276', marginBottom: 6 },
  bannerText: { fontSize: 13, color: '#2c3e50', lineHeight: 20 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginHorizontal: 16, marginTop: 20, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#7f8c8d', marginHorizontal: 16, marginBottom: 10 },
  bulkActionsRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  bulkActionButton: {
    borderWidth: 1,
    borderColor: '#2980B9',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bulkActionButtonDisabled: {
    opacity: 0.6,
  },
  bulkActionButtonText: {
    color: '#2980B9',
    fontSize: 12,
    fontWeight: '700',
  },

  consentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  consentIcon: { fontSize: 24, marginRight: 12, marginTop: 2 },
  consentInfo: { flex: 1, marginRight: 8 },
  consentLabel: { fontSize: 14, fontWeight: '700', color: '#2c3e50', marginBottom: 3 },
  requiredBadge: { color: '#e74c3c', fontWeight: '800' },
  consentDesc: { fontSize: 12, color: '#555', lineHeight: 17, marginBottom: 4 },
  statusBadge: { fontSize: 11, fontWeight: '600' },
  statusActive: { color: '#27ae60' },
  statusInactive: { color: '#c0392b' },

  warningCard: {
    backgroundColor: '#fff8f0',
    borderWidth: 1,
    borderColor: '#f39c12',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dangerCard: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#e74c3c',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nomineeCard: {
    backgroundColor: '#f2f8ff',
    borderWidth: 1,
    borderColor: '#3498db',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: { fontSize: 24, marginRight: 12 },
  warningContent: { flex: 1 },
  warningTitle: { fontSize: 14, fontWeight: '700', color: '#b7770d', marginBottom: 4 },
  dangerTitle: { fontSize: 14, fontWeight: '700', color: '#c0392b', marginBottom: 4 },
  nomineeTitle: { fontSize: 14, fontWeight: '700', color: '#1f5f8b', marginBottom: 4 },
  warningDesc: { fontSize: 12, color: '#555', lineHeight: 18 },

  grievanceCard: {
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2c3e50',
  },
  grievanceTitle: { fontSize: 15, fontWeight: '800', color: '#2c3e50', marginBottom: 8 },
  grievanceText: { fontSize: 13, color: '#2c3e50', lineHeight: 22 },
  bold: { fontWeight: '700' },

  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  savingText: { color: '#fff', marginTop: 10, fontSize: 14 },
});
