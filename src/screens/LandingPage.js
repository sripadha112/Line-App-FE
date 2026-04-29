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
  PanResponder,
  Image
} from 'react-native';

export default function LandingPage({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeGallery, setActiveGallery] = useState(0);
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
    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 5000);

    // Auto-rotate gallery
    const galleryInterval = setInterval(() => {
      setActiveGallery((prev) => (prev + 1) % 6);
    }, 4000);

    return () => {
      clearInterval(featureInterval);
      clearInterval(galleryInterval);
    };
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

  const galleryImages = [
    require('../../assets/image-01.jpeg'),
    require('../../assets/image-02.jpeg'),
    require('../../assets/image-03.jpeg'),
    require('../../assets/image-04.jpeg'),
    require('../../assets/image-05.jpeg'),
    require('../../assets/image-06.jpeg'),
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

      {/* Gallery Section */}
      <View style={styles.gallerySection}>
        <Text style={styles.sectionLabel}>APP GALLERY</Text>
        <Text style={styles.sectionTitle}>Explore NeextApp's Interface</Text>
        
        <View style={styles.carouselContainer}>
          <View style={styles.carouselWrapper}>
            {galleryImages.map((image, index) => {
              const isActive = index === activeGallery;
              const isPrev = index === (activeGallery - 1 + galleryImages.length) % galleryImages.length;
              const isNext = index === (activeGallery + 1) % galleryImages.length;
              
              let cardStyle = styles.galleryCardHidden;
              if (isActive) {
                cardStyle = styles.galleryCardActive;
              } else if (isPrev) {
                cardStyle = styles.galleryCardLeft;
              } else if (isNext) {
                cardStyle = styles.galleryCardRight;
              }
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.galleryCardBase, cardStyle]}
                  onPress={() => setActiveGallery(index)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={image}
                    style={styles.galleryImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Navigation Arrows */}
          <TouchableOpacity 
            style={[styles.galleryArrow, styles.galleryArrowLeft]}
            onPress={() => setActiveGallery((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
          >
            <Text style={styles.galleryArrowText}>‹</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.galleryArrow, styles.galleryArrowRight]}
            onPress={() => setActiveGallery((prev) => (prev + 1) % galleryImages.length)}
          >
            <Text style={styles.galleryArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dotsContainer}>
          {galleryImages.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveGallery(index)}
              style={[
                styles.dot,
                activeGallery === index && styles.dotActive,
              ]}
            />
          ))}
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

      {/* About Us & Contact Us in Footer */}
      <View style={styles.footerInfoSection}>
        <View style={styles.footerInfoContainer}>
          {/* About Us - Left Side */}
          <View style={styles.footerInfoCard}>
            <Text style={styles.footerInfoTitle}>About Us</Text>
            <Text style={styles.footerInfoText}>
              <Text style={styles.footerInfoBrand}>NeextApp</Text> is your trusted healthcare companion, revolutionizing the way you book and manage medical appointments.
            </Text>
            <Text style={styles.footerInfoText}>
              We understand that your time is valuable, and accessing healthcare should be simple and convenient. That's why we've created a seamless platform that connects patients with healthcare providers instantly.
            </Text>
            <Text style={styles.footerInfoText}>
              Our mission is to make healthcare more accessible for everyone by eliminating the hassles of traditional appointment booking. With NeextApp, you can find doctors, book appointments, manage your family's healthcare, and access your medical history - all in one place.
            </Text>
          </View>

          {/* Contact Us - Right Side */}
          <View style={styles.footerInfoCard}>
            <Text style={styles.footerInfoTitle}>Contact Us</Text>
            <Text style={styles.footerInfoText}>
              Have questions? We'd love to hear from you.
            </Text>
            
            <View style={styles.footerContactList}>
              <Text style={styles.footerContactItem}>Email: developers.neextapp@gmail.com</Text>
              <Text style={styles.footerContactItem}>Phone: +91</Text>
              <Text style={styles.footerContactItem}>Address: Boduppal, Hyderabad, Telangana, 500092</Text>
            </View>
            
            <View style={styles.footerSocial}>
              <Text style={styles.footerSocialText}>Follow Us:</Text>
              <View style={styles.footerSocialIcons}>
                <View style={styles.footerSocialIcon}>
                  <Text style={styles.footerSocialIconText}>f</Text>
                </View>
                <View style={styles.footerSocialIcon}>
                  <Text style={styles.footerSocialIconText}>𝕏</Text>
                </View>
                <View style={styles.footerSocialIcon}>
                  <Text style={styles.footerSocialIconText}>📷</Text>
                </View>
                <View style={styles.footerSocialIcon}>
                  <Text style={styles.footerSocialIconText}>in</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Copyright Footer */}
        <View style={styles.footerCopyright}>
          <Text style={styles.footerText}>© 2026 NeextApp. Healthcare Made Simple.</Text>
          <Text style={styles.footerSubtext}>Your health, our priority</Text>
        </View>
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

  // Gallery Section
  gallerySection: {
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'web' ? 80 : 60,
    backgroundColor: '#f8f9ff',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  carouselContainer: {
    marginTop: 40,
    height: width > 768 ? 450 : 580,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCardBase: {
    position: 'absolute',
    width: width > 768 ? 280 : 280,
    height: width > 768 ? 420 : 520,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#4f46e5',
    overflow: 'hidden',
    transition: 'all 0.5s ease',
  },
  galleryCardActive: {
    transform: [{ scale: 1 }, { translateX: 0 }],
    opacity: 1,
    zIndex: 3,
  },
  galleryCardLeft: {
    transform: [
      { scale: 0.85 },
      { translateX: width > 768 ? -180 : -140 },
    ],
    opacity: 0.5,
    zIndex: 2,
  },
  galleryCardRight: {
    transform: [
      { scale: 0.85 },
      { translateX: width > 768 ? 180 : 140 },
    ],
    opacity: 0.5,
    zIndex: 2,
  },
  galleryCardHidden: {
    opacity: 0,
    transform: [{ scale: 0.5 }],
    zIndex: 1,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  galleryArrow: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(79, 70, 229, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  galleryArrowLeft: {
    left: width > 768 ? 50 : 10,
    transform: [{ translateY: -25 }],
  },
  galleryArrowRight: {
    right: width > 768 ? 50 : 10,
    transform: [{ translateY: -25 }],
  },
  galleryArrowText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
    lineHeight: 32,
  },

  // Footer Info Section (About Us & Contact Us)
  footerInfoSection: {
    backgroundColor: '#4f46e5',
    paddingTop: width > 768 ? 60 : 40,
  },
  footerInfoContainer: {
    paddingHorizontal: width > 768 ? 40 : 20,
    paddingBottom: width > 768 ? 50 : 40,
    flexDirection: width > 768 ? 'row' : 'column',
    justifyContent: 'space-between',
    gap: width > 768 ? 60 : 30,
    width: '100%',
  },
  footerInfoCard: {
    flex: width > 768 ? '0 0 45%' : 1,
    maxWidth: width > 768 ? '45%' : '100%',
  },
  footerInfoTitle: {
    fontSize: width > 768 ? 24 : 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  footerInfoText: {
    fontSize: width > 768 ? 15 : 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: width > 768 ? 24 : 22,
    marginBottom: 14,
  },
  footerInfoBrand: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: width > 768 ? 16 : 15,
  },
  
  // Footer Contact List
  footerContactList: {
    marginTop: 10,
    marginBottom: 24,
  },
  footerContactItem: {
    fontSize: width > 768 ? 14 : 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    marginBottom: 8,
  },
  
  // Footer Social
  footerSocial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  footerSocialText: {
    fontSize: width > 768 ? 15 : 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  footerSocialIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  footerSocialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  footerSocialIconText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },

  // Copyright Footer
  footerCopyright: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#3730a3',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
