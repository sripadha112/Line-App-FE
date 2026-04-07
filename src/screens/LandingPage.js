import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Platform,
  Animated,
  Dimensions,
  PanResponder
} from 'react-native';

export default function LandingPage({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [activeFeature, setActiveFeature] = useState(0);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  // Pan responder for swipe gestures on mobile
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          // Swipe right - go to previous
          setActiveFeature((prev) => (prev - 1 + 3) % 3);
        } else if (gestureState.dx < -50) {
          // Swipe left - go to next
          setActiveFeature((prev) => (prev + 1) % 3);
        }
      },
    })
  ).current;

  useEffect(() => {
    // Handle window resize for responsive design
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    // Fade in and slide up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '🏥',
      title: 'Find Healthcare Providers',
      description: 'Search and discover doctors and clinics near you with ease',
    },
    {
      icon: '📅',
      title: 'Book Appointments Instantly',
      description: 'Schedule appointments 24/7 with real-time availability',
    },
    {
      icon: '💊',
      title: 'Digital Prescriptions',
      description: 'Access and manage your prescriptions digitally',
    },
  ];

  const benefits = [
    { icon: '⚡', title: 'Lightning Fast', desc: 'Book appointments in seconds' },
    { icon: '🔒', title: 'Secure & Private', desc: 'Your health data is protected' },
    { icon: '📱', title: 'Multi-Platform', desc: 'Access from web or mobile' },
    { icon: '🔔', title: 'Smart Notifications', desc: 'Never miss an appointment' },
  ];

  const styles = getStyles(windowWidth);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <Animated.View 
        style={[
          styles.hero,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.heroContent}>
          <Text style={styles.badge}>🏥 Healthcare Made Simple</Text>
          <Text style={styles.heroTitle}>
            Your Health,{'\n'}
            <Text style={styles.heroTitleAccent}>Just a Click Away</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Connect with healthcare providers, book appointments instantly, and manage your health journey - all in one place.
          </Text>
          
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonText}>Get Started</Text>
            <Text style={styles.ctaButtonArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Doctors</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50K+</Text>
              <Text style={styles.statLabel}>Appointments</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Problem Statement Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>THE PROBLEM</Text>
        <Text style={styles.sectionTitle}>Healthcare Should Be Accessible</Text>
        <Text style={styles.sectionText}>
          Finding the right doctor, booking appointments, managing prescriptions - healthcare management shouldn't be complicated. We're here to simplify your healthcare journey.
        </Text>
      </View>

      {/* Features Carousel */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionLabel}>FEATURES</Text>
        <Text style={styles.sectionTitle}>Everything You Need</Text>
        
        <View style={styles.featuresCarousel}>
          {windowWidth > 768 ? (
            // Desktop: Show all cards
            features.map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureCard,
                  activeFeature === index && styles.featureCardActive,
                ]}
              >
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </Animated.View>
            ))
          ) : (
            // Mobile: Show only active card with swipe support
            <View {...panResponder.panHandlers} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{features[activeFeature].icon}</Text>
              <Text style={styles.featureTitle}>{features[activeFeature].title}</Text>
              <Text style={styles.featureDescription}>{features[activeFeature].description}</Text>
              <Text style={styles.swipeHint}>← Swipe to explore →</Text>
            </View>
          )}
        </View>

        <View style={styles.dotsContainer}>
          {features.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveFeature(index)}
              style={[
                styles.dot,
                activeFeature === index && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Benefits Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>WHY CHOOSE US</Text>
        <Text style={styles.sectionTitle}>Built for Your Convenience</Text>
        
        <View style={styles.benefitsGrid}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitCard}>
              <Text style={styles.benefitIcon}>{benefit.icon}</Text>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitDesc}>{benefit.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
        <Text style={styles.sectionTitle}>Simple 3-Step Process</Text>
        
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Sign Up</Text>
              <Text style={styles.stepText}>Create your account in seconds with mobile verification</Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Find & Book</Text>
              <Text style={styles.stepText}>Search for doctors and book available time slots</Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Visit & Get Care</Text>
              <Text style={styles.stepText}>Visit your appointment and receive digital prescriptions</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Use Cases */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>WHO IS IT FOR</Text>
        <Text style={styles.sectionTitle}>Perfect For Everyone</Text>
        
        <View style={styles.useCasesContainer}>
          <View style={styles.useCaseCard}>
            <Text style={styles.useCaseIcon}>👥</Text>
            <Text style={styles.useCaseTitle}>Patients</Text>
            <Text style={styles.useCaseText}>
              Find doctors, book appointments, manage family members, track appointments, and access prescriptions
            </Text>
          </View>

          <View style={styles.useCaseCard}>
            <Text style={styles.useCaseIcon}>👨‍⚕️</Text>
            <Text style={styles.useCaseTitle}>Doctors</Text>
            <Text style={styles.useCaseText}>
              Manage schedules, handle bookings, provide prescriptions, and grow your practice digitally
            </Text>
          </View>
        </View>
      </View>

      {/* Final CTA Section */}
      <View style={styles.finalCTA}>
        <Text style={styles.finalCTATitle}>Ready to Get Started?</Text>
        <Text style={styles.finalCTAText}>
          Join thousands of users who trust us with their healthcare management
        </Text>
        <TouchableOpacity 
          style={styles.finalCTAButton}
          onPress={() => navigation.navigate('Auth')}
          activeOpacity={0.8}
        >
          <Text style={styles.finalCTAButtonText}>Start Your Journey</Text>
          <Text style={styles.ctaButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 NeextApp. Healthcare Made Simple.</Text>
        <Text style={styles.footerSubtext}>Your health, our priority</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (width) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Hero Section
  hero: {
    minHeight: width > 768 ? (Platform.OS === 'web' ? 600 : 500) : 550,
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 20,
    paddingTop: width > 768 ? (Platform.OS === 'web' ? 80 : 60) : 50,
    paddingBottom: width > 768 ? 60 : 40,
  },
  heroContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  badge: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
    marginBottom: 20,
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroTitle: {
    fontSize: width > 768 ? (Platform.OS === 'web' ? 56 : 42) : width > 480 ? 36 : 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
    lineHeight: width > 768 ? (Platform.OS === 'web' ? 68 : 52) : width > 480 ? 44 : 40,
  },
  heroTitleAccent: {
    color: '#4f46e5',
  },
  heroSubtitle: {
    fontSize: width > 768 ? (Platform.OS === 'web' ? 20 : 18) : 16,
    color: '#64748b',
    lineHeight: width > 768 ? 32 : 24,
    marginBottom: 40,
    maxWidth: 600,
  },
  ctaButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  ctaButtonArrow: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: width > 768 ? 60 : 40,
    padding: width > 768 ? 30 : 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: width > 768 ? 32 : width > 480 ? 24 : 20,
    fontWeight: '800',
    color: '#4f46e5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: width > 768 ? 14 : 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: width > 768 ? 20 : 10,
  },

  // Section Styles
  section: {
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'web' && width > 768 ? 80 : 50,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sectionLabel: {
    fontSize: Platform.OS === 'web' && width > 768 ? 12 : 11,
    fontWeight: '700',
    color: '#4f46e5',
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: width > 768 ? (Platform.OS === 'web' ? 42 : 32) : 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
    lineHeight: width > 768 ? (Platform.OS === 'web' ? 52 : 40) : 36,
  },
  sectionText: {
    fontSize: width > 768 ? 18 : 16,
    color: '#64748b',
    lineHeight: width > 768 ? 28 : 24,
    maxWidth: 700,
  },

  // Features Carousel
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'web' ? 80 : 60,
    backgroundColor: '#f8f9ff',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  featuresCarousel: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 40,
    justifyContent: width > 768 ? 'flex-start' : 'center',
  },
  featureCard: {
    flex: width > 768 ? 1 : undefined,
    width: width > 768 ? undefined : '100%',
    maxWidth: width > 768 ? undefined : 400,
    backgroundColor: '#ffffff',
    padding: width > 768 ? 32 : 24,
    borderRadius: 20,
    minHeight: width > 768 ? 280 : 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  featureCardActive: {
    borderWidth: 2,
    borderColor: '#4f46e5',
    opacity: 1,
  },
  featureIcon: {
    fontSize: width > 768 ? 48 : 40,
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: width > 768 ? 24 : 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: width > 768 ? 16 : 15,
    color: '#64748b',
    lineHeight: 24,
  },
  swipeHint: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    gap: 8,
  },
  dot: {
    width: width > 768 ? 8 : 10,
    height: width > 768 ? 8 : 10,
    borderRadius: width > 768 ? 4 : 5,
    backgroundColor: '#cbd5e1',
  },
  dotActive: {
    width: width > 768 ? 24 : 28,
    backgroundColor: '#4f46e5',
  },

  // Benefits Grid
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: width > 768 ? 16 : 12,
    marginTop: 40,
  },
  benefitCard: {
    width: width > 768 ? 'calc(50% - 8px)' : 'calc(50% - 6px)',
    backgroundColor: '#ffffff',
    padding: width > 768 ? 28 : width > 480 ? 20 : 16,
    borderRadius: width > 768 ? 16 : 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 0,
  },
  benefitIcon: {
    fontSize: width > 768 ? 36 : width > 480 ? 28 : 24,
    marginBottom: width > 768 ? 16 : 12,
  },
  benefitTitle: {
    fontSize: width > 768 ? 20 : width > 480 ? 16 : 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: width > 768 ? 8 : 6,
  },
  benefitDesc: {
    fontSize: width > 768 ? 15 : width > 480 ? 13 : 12,
    color: '#64748b',
    lineHeight: width > 768 ? 22 : 18,
  },

  // Steps
  stepsContainer: {
    marginTop: 40,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  stepNumber: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  stepConnector: {
    width: 2,
    height: 40,
    backgroundColor: '#e2e8f0',
    marginLeft: 27,
    marginVertical: 12,
  },

  // Use Cases
  useCasesContainer: {
    flexDirection: Platform.OS === 'web' && width > 768 ? 'row' : 'column',
    gap: 20,
    marginTop: 40,
  },
  useCaseCard: {
    flex: Platform.OS === 'web' && width > 768 ? 1 : undefined,
    width: Platform.OS === 'web' && width > 768 ? undefined : '100%',
    backgroundColor: '#f8f9ff',
    padding: Platform.OS === 'web' && width > 768 ? 32 : 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  useCaseIcon: {
    fontSize: width > 768 ? 48 : 40,
    marginBottom: 16,
  },
  useCaseTitle: {
    fontSize: width > 768 ? 24 : 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  useCaseText: {
    fontSize: width > 768 ? 16 : 15,
    color: '#64748b',
    lineHeight: 24,
  },

  // Final CTA
  finalCTA: {
    paddingHorizontal: 20,
    paddingVertical: width > 768 ? 80 : 50,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
  },
  finalCTATitle: {
    fontSize: width > 768 ? (Platform.OS === 'web' ? 42 : 32) : 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  finalCTAText: {
    fontSize: width > 768 ? 18 : 16,
    color: '#e0e7ff',
    marginBottom: 40,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: width > 768 ? 28 : 24,
  },
  finalCTAButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  finalCTAButtonText: {
    color: '#4f46e5',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
});
