import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Linking, Alert, Share, Platform, Modal } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BottomNavigation({ activeTab, onTabChange, onRefresh, userType = 'doctor' }) {
  const insets = useSafeAreaInsets();
  const safeBottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 6 : 4);
  const [showReferPopup, setShowReferPopup] = useState(false);

  const appUrl = useMemo(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return 'https://kedulz.com';
  }, []);

  const referralMessage = useMemo(() => (
    `Try Kedulz for quick healthcare appointments. Book appointments, manage family members, and get timely reminders.\n\n${appUrl}`
  ), [appUrl]);
  const getDoctorTabs = () => [
    { id: 'appointments', icon: '🏠', label: 'Home' },
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'refer', icon: '👥', label: 'Refer' }
  ];

  const getUserTabs = () => [
    { id: 'appointments', icon: '🏠', label: 'Home' },
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'refer', icon: '👥', label: 'Refer' }
  ];

  const handleReferFriend = async () => {
    // On web, show a custom popup with Copy / Share / Cancel.
    if (Platform.OS === 'web') {
      setShowReferPopup(true);
      return;
    }

    const proceedToWhatsApp = await new Promise((resolve) => {
      Alert.alert(
        'Open WhatsApp?',
        'Do you want to open WhatsApp to share Kedulz with your contacts?',
        [
          { text: 'No', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Yes', onPress: () => resolve(true) },
        ]
      );
    });

    if (!proceedToWhatsApp) {
      setShowReferPopup(true);
      return;
    }

    const whatsappUrls = Platform.OS === 'ios'
      ? [
          `whatsapp://send?text=${encodeURIComponent(referralMessage)}`,
          `https://wa.me/?text=${encodeURIComponent(referralMessage)}`,
          `https://api.whatsapp.com/send?text=${encodeURIComponent(referralMessage)}`
        ]
      : [`whatsapp://send?text=${encodeURIComponent(referralMessage)}`];

    for (const url of whatsappUrls) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return;
        }
      } catch (error) {
        console.log(`Failed to open ${url}:`, error);
      }
    }

    setShowReferPopup(true);
  };

  const handleCopyReferMessage = async () => {
    try {
      await Clipboard.setStringAsync(referralMessage);
      Alert.alert('Copied', 'Referral message copied to clipboard.');
      setShowReferPopup(false);
    } catch (error) {
      console.error('Copy failed:', error);
      Alert.alert('Copy Failed', 'Unable to copy the message right now.');
    }
  };

  const handleShareReferMessage = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'Kedulz',
          text: referralMessage,
          url: appUrl,
        });
      } else {
        await Share.share({
          title: 'Kedulz',
          message: referralMessage,
        });
      }
      setShowReferPopup(false);
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error('Share failed:', error);
      Alert.alert('Share Failed', 'Unable to open share options. Try Copy instead.');
    }
  };

  const tabs = userType === 'user' ? getUserTabs() : getDoctorTabs();

  const handleTabPress = (tabId) => {
    if (tabId === 'refer') {
      handleReferFriend();
      return;
    }
    
    if (tabId === 'appointments' && onRefresh) {
      onRefresh();
    }
    onTabChange(tabId);
  };

  return (
    <>
      <View style={[styles.container, { paddingBottom: safeBottomPadding }]}>
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab.id}
            style={[styles.navItem, activeTab === tab.id && styles.navItemActive]} 
            onPress={() => handleTabPress(tab.id)}
          >
            <Text style={[styles.navIcon, activeTab === tab.id && styles.navIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.navLabel, activeTab === tab.id && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={showReferPopup}
        onRequestClose={() => setShowReferPopup(false)}
      >
        <View style={styles.referOverlay}>
          <View style={styles.referCard}>
            <Text style={styles.referTitle}>Refer Kedulz</Text>
            <Text style={styles.referMessage}>{referralMessage}</Text>

            <View style={styles.referActionsRow}>
              <TouchableOpacity style={[styles.referActionButton, styles.copyButton]} onPress={handleCopyReferMessage}>
                <Text style={styles.referActionButtonText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.referActionButton, styles.shareButton]} onPress={handleShareReferMessage}>
                <Text style={styles.referActionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelReferButton} onPress={() => setShowReferPopup(false)}>
              <Text style={styles.cancelReferText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    zIndex: 1000,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 60,
  },
  navItemActive: {
    backgroundColor: '#e3f2fd',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    color: '#666',
  },
  navIconActive: {
    color: '#2196f3',
  },
  navLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#2196f3',
    fontWeight: '600',
  },
  referOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  referCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
  },
  referTitle: {
    fontSize: 20,
    color: '#1f2937',
    fontWeight: '700',
    marginBottom: 10,
  },
  referMessage: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 18,
  },
  referActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  referActionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: '#0ea5e9',
  },
  shareButton: {
    backgroundColor: '#10b981',
  },
  referActionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelReferButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelReferText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
});
