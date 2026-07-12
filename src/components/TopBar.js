import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const androidStatusInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const topPadding = Platform.OS === 'ios' ? insets.top + 12 : androidStatusInset + 10;
  const expandedHeight = topPadding + 42;

  const getGreeting = () => {
    if (userType === 'doctor') {
      return `Hi, Dr. ${name}`;
    } else if (userType === 'user') {
      return `Hi, ${name}`;
    }
    return `Hi, ${name}`;
  };

  // Animated header that collapses on scroll down (no visible blank top padding)
  const animatedStyle = scrollY
    ? {
        height: scrollY.interpolate({
          inputRange: [0, 90],
          outputRange: [expandedHeight, 0],
          extrapolate: 'clamp',
        }),
        opacity: scrollY.interpolate({
          inputRange: [0, 70, 90],
          outputRange: [1, 0.2, 0],
          extrapolate: 'clamp',
        }),
        paddingTop: scrollY.interpolate({
          inputRange: [0, 90],
          outputRange: [topPadding, 0],
          extrapolate: 'clamp',
        }),
        paddingBottom: scrollY.interpolate({
          inputRange: [0, 90],
          outputRange: [10, 0],
          extrapolate: 'clamp',
        }),
      }
    : {
        height: expandedHeight,
        paddingTop: topPadding,
        paddingBottom: 10,
      };

  return (
    <Animated.View style={[styles.topBar, animatedStyle]}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      )}
      <Text 
        style={styles.greeting} 
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title || getGreeting()}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0b0b0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    paddingRight: 16,
    paddingVertical: 8,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: '#3498db',
    fontWeight: 'bold',
  },
  greeting: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    lineHeight: 22,
  },
});
