import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import TopBar from '../components/TopBar';
import FCMTestComponent from '../components/FCMTestComponent';

/**
 * FCM Test Screen - Dedicated screen for testing FCM functionality
 * Navigate to this screen to test push notifications
 */
export default function FCMTestScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TopBar name="FCM Test" />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <FCMTestComponent />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});