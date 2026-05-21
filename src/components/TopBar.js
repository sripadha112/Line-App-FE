import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';

/**
 * TopBar Component - Compact and responsive header
 * 
 * Props:
 * - name: User's name to display
 * - title: Optional custom title (overrides greeting)
 * - userType: 'doctor' or 'user' (default: 'doctor')
 * - onBack: Optional back button handler
 * - scrollY: Optional Animated.Value for scroll-based hide/show behavior
 * 
 * Example with scroll behavior:
 * ```
 * const scrollY = useRef(new Animated.Value(0)).current;
 * 
 * <TopBar name={name} userType="doctor" scrollY={scrollY} />
 * <Animated.ScrollView
 *   onScroll={Animated.event(
 *     [{ nativeEvent: { contentOffset: { y: scrollY } } }],
 *     { useNativeDriver: true }
 *   )}
 *   scrollEventThrottle={16}
 * >
 *   // Content
 * </Animated.ScrollView>
 * ```
 */
export default function TopBar({ name, title, userType = 'doctor', onBack, scrollY }) {
  const getGreeting = () => {
    if (userType === 'doctor') {
      return `Hi, Dr. ${name}`;
    } else if (userType === 'user') {
      return `Hi, ${name}`;
    }
    return `Hi, ${name}`;
  };

  // Animated header that hides on scroll down, shows on scroll up
  const headerTranslate = scrollY ? scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  }) : 0;

  const animatedStyle = scrollY ? {
    transform: [{ translateY: headerTranslate }],
  } : {};

  return (
    <Animated.View style={[styles.topBar, animatedStyle]}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    minHeight: Platform.OS === 'ios' ? 60 : 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: 8,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    paddingRight: 12,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  backText: {
    fontSize: 22,
    color: '#3498db',
    fontWeight: 'bold',
    lineHeight: 18,
  },
  greeting: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    lineHeight: 20,
  },
});
