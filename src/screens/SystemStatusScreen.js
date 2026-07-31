import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const VARIANTS = {
  success: {
    title: 'Success',
    message: 'Operation completed successfully.',
    icon: 'OK',
    color: '#2e7d32',
  },
  failure: {
    title: 'Failure',
    message: 'Something went wrong. Please try again.',
    icon: 'X',
    color: '#c62828',
  },
  notFound: {
    title: '404 Not Found',
    message: 'The requested resource was not found.',
    icon: '404',
    color: '#ef6c00',
  },
  connectivity: {
    title: 'Connectivity Issue',
    message: 'Unable to connect. Check your internet connection and try again.',
    icon: 'NET',
    color: '#1565c0',
  },
  slowNetwork: {
    title: 'Slow Network',
    message: 'The network is slow. Please wait or try again shortly.',
    icon: '...',
    color: '#6a1b9a',
  },
  serverError: {
    title: '500 Internal Server Issue',
    message: 'The server is currently unavailable. Please try again later.',
    icon: '500',
    color: '#ad1457',
  },
};

export default function SystemStatusScreen({ route, navigation }) {
  const {
    variant = 'failure',
    title,
    message,
    returnRoute,
    returnParams,
    primaryButtonText = 'Go Back',
  } = route?.params || {};

  const variantConfig = VARIANTS[variant] || VARIANTS.failure;

  const handlePrimaryAction = () => {
    if (returnRoute) {
      navigation.navigate(returnRoute, returnParams || {});
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Landing');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.iconCircle, { borderColor: variantConfig.color }]}>
          <Text style={[styles.iconText, { color: variantConfig.color }]}>{variantConfig.icon}</Text>
        </View>

        <Text style={styles.title}>{title || variantConfig.title}</Text>
        <Text style={styles.message}>{message || variantConfig.message}</Text>

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: variantConfig.color }]} onPress={handlePrimaryAction}>
          <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Landing')}>
          <Text style={styles.secondaryButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  primaryButton: {
    minWidth: 180,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
});
