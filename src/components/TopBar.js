import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_ROW_HEIGHT = 44;

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
  const expandedHeight = topPadding + HEADER_ROW_HEIGHT + 8;

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
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <View style={styles.backChevron} />
          </TouchableOpacity>
        ) : (
          <View style={styles.sideSlot} />
        )}

        <Text
          style={styles.greeting}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title || getGreeting()}
        </Text>

        <View style={styles.sideSlot} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topBar: {
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
  row: {
    height: HEADER_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideSlot: {
    width: 40,
    height: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backChevron: {
    width: 12,
    height: 12,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: '#2c3e50',
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  greeting: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    lineHeight: 24,
    textAlign: 'center',
  },
});
