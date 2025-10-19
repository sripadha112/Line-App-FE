import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TopBar({ name, title, userType = 'doctor', onBack }) {
  const getGreeting = () => {
    if (userType === 'doctor') {
      return `Hi, Dr. ${name}`;
    } else if (userType === 'user') {
      return `Hi, ${name}`;
    }
    return `Hi, ${name}`;
  };

  return (
    <View style={styles.topBar}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      )}
      <Text 
        style={styles.greeting} 
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {title || getGreeting()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    paddingRight: 15,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  backText: {
    fontSize: 24,
    color: '#3498db',
    fontWeight: 'bold',
    paddingBottom: 14,
  },
  greeting: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    lineHeight: 22,
  },
});
