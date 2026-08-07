import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_BASE_URL from '../config';

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

const AUTO_RECOVERY_VARIANTS = new Set(['connectivity', 'slowNetwork', 'serverError']);
const RECOVERY_CHECK_INTERVAL_MS = 5000;
const RECOVERY_CHECK_TIMEOUT_MS = 8000;

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
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(AUTO_RECOVERY_VARIANTS.has(variant));

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

  useEffect(() => {
    if (!AUTO_RECOVERY_VARIANTS.has(variant)) {
      return undefined;
    }

    let isMounted = true;
    let isChecking = false;
    let timeoutId = null;

    const checkRecovery = async () => {
      if (isChecking || !API_BASE_URL) {
        return;
      }

      isChecking = true;
      setIsCheckingRecovery(true);

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), RECOVERY_CHECK_TIMEOUT_MS);

      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok && isMounted) {
          handlePrimaryAction();
        }
      } catch (error) {
        // Stay on the status screen until a health check succeeds.
      } finally {
        clearTimeout(timeoutId);
        timeoutId = null;
        isChecking = false;
        if (isMounted) {
          setIsCheckingRecovery(false);
        }
      }
    };

    checkRecovery();
    const intervalId = setInterval(checkRecovery, RECOVERY_CHECK_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [variant, returnRoute, returnParams, navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.iconCircle, { borderColor: variantConfig.color }]}>
          <Text style={[styles.iconText, { color: variantConfig.color }]}>{variantConfig.icon}</Text>
        </View>

        <Text style={styles.title}>{title || variantConfig.title}</Text>
        <Text style={styles.message}>{message || variantConfig.message}</Text>
        {AUTO_RECOVERY_VARIANTS.has(variant) && (
          <Text style={styles.recoveryText}>
            {isCheckingRecovery ? 'Checking connection...' : 'Waiting for connection to recover...'}
          </Text>
        )}

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
    marginBottom: 12,
  },
  recoveryText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
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
