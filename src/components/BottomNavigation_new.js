import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Linking, Alert, Share, Platform } from 'react-native';

export default function BottomNavigation({ activeTab, onTabChange, onRefresh, userType = 'doctor' }) {
  const getDoctorTabs = () => [
    { id: 'appointments', icon: '🏠', label: 'Home' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'profile', icon: '👤', label: 'Profile' }
  ];

  const getUserTabs = () => [
    { id: 'appointments', icon: '🏠', label: 'Home' },
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'refer', icon: '👥', label: 'Refer' }
  ];

  const handleReferFriend = async () => {
    const referralMessage = 'Hey! I have been using this amazing healthcare app for booking appointments. It is really convenient and easy to use. You should try it too! Download the app and book your appointments hassle-free. Thanks for checking it out!';
    
    // Different WhatsApp URL schemes for iOS and Android
    const whatsappUrls = Platform.OS === 'ios' 
      ? [
          `whatsapp://send?text=${encodeURIComponent(referralMessage)}`,
          `https://wa.me/?text=${encodeURIComponent(referralMessage)}`,
          `https://api.whatsapp.com/send?text=${encodeURIComponent(referralMessage)}`
        ]
      : [`whatsapp://send?text=${encodeURIComponent(referralMessage)}`];
    
    // Try WhatsApp URLs
    for (const url of whatsappUrls) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return; // Successfully opened WhatsApp
        }
      } catch (error) {
        console.log(`Failed to open ${url}:`, error);
      }
    }
    
    // If WhatsApp is not available, use native Share API
    try {
      const result = await Share.share({
        message: referralMessage,
        title: 'Share Healthcare App'
      });
      
      if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert(
        'Unable to Share',
        'Please install WhatsApp or use another sharing method.',
        [
          { text: 'OK' },
          { 
            text: 'Copy Message', 
            onPress: () => {
              // You can add Clipboard functionality here if needed
              Alert.alert('Message', referralMessage);
            }
          }
        ]
      );
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
    <View style={styles.container}>
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
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
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
});
