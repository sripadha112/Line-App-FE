import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, useWindowDimensions } from 'react-native';
import ContentLoader, { Rect, Circle } from 'react-content-loader/native';

const SkeletonWelcomeSection = () => {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.section}>
      <ContentLoader
        speed={1}
        width={width - 40}
        height={60}
        viewBox={`0 0 ${width - 40} 60`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        <Rect x="0" y="10" rx="4" ry="4" width={width * 0.6} height="20" />
        <Rect x="0" y="38" rx="3" ry="3" width={width * 0.4} height="14" />
      </ContentLoader>
    </View>
  );
};

const SkeletonFamilySection = () => {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.section}>
      <ContentLoader
        speed={1}
        width={width - 40}
        height={120}
        viewBox={`0 0 ${width - 40} 120`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        <Rect x="0" y="10" rx="4" ry="4" width="80" height="16" />
        {/* Family circles */}
        <Circle cx="35" cy="70" r="30" />
        <Circle cx="105" cy="70" r="30" />
        <Circle cx="175" cy="70" r="30" />
      </ContentLoader>
    </View>
  );
};

const SkeletonActiveBookings = () => {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.section}>
      <ContentLoader
        speed={1}
        width={width - 40}
        height={180}
        viewBox={`0 0 ${width - 40} 180`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        <Rect x="0" y="10" rx="4" ry="4" width="140" height="18" />
        <Rect x="0" y="40" rx="12" ry="12" width={width - 40} height="130" />
      </ContentLoader>
    </View>
  );
};

const SkeletonQuickActions = () => {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 70) / 2;
  return (
    <View style={styles.section}>
      <ContentLoader
        speed={1}
        width={width - 40}
        height={300}
        viewBox={`0 0 ${width - 40} 300`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        <Rect x="0" y="10" rx="4" ry="4" width="120" height="18" />
        {/* Action cards row 1 */}
        <Rect x="0" y="40" rx="12" ry="12" width={cardWidth} height="110" />
        <Rect x={cardWidth + 10} y="40" rx="12" ry="12" width={cardWidth} height="110" />
        
        <Rect x="0" y="170" rx="4" ry="4" width="140" height="18" />
        {/* Action cards row 2 */}
        <Rect x="0" y="200" rx="12" ry="12" width={cardWidth} height="90" />
        <Rect x={cardWidth + 10} y="200" rx="12" ry="12" width={cardWidth} height="90" />
      </ContentLoader>
    </View>
  );
};

export const SkeletonUserHome = () => {
  return (
    <ScrollView style={styles.screenContainer} showsVerticalScrollIndicator={false}>
      <SkeletonWelcomeSection />
      <SkeletonFamilySection />
      <SkeletonActiveBookings />
      <SkeletonQuickActions />
    </ScrollView>
  );
};

export const SkeletonDoctorHome = () => {
  const { width } = useWindowDimensions();
  return (
    <ScrollView style={styles.screenContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <ContentLoader
          speed={1}
          width={width - 40}
          height={200}
          viewBox={`0 0 ${width - 40} 200`}
          backgroundColor="#f3f3f3"
          foregroundColor="#ecebeb"
        >
          {/* Stats cards */}
          <Rect x="0" y="10" rx="12" ry="12" width={(width - 60) / 2} height="80" />
          <Rect x={(width - 40) / 2 + 10} y="10" rx="12" ry="12" width={(width - 60) / 2} height="80" />
          
          {/* Appointments */}
          <Rect x="0" y="110" rx="12" ry="12" width={width - 40} height="80" />
        </ContentLoader>
      </View>
    </ScrollView>
  );
};

const SkeletonTodaySchedule = () => {
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;
  
  return (
    <View style={styles.section}>
      <ContentLoader
        speed={1}
        width={cardWidth}
        height={380}
        viewBox={`0 0 ${cardWidth} 380`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        {/* Expanded container background */}
        <Rect x="0" y="0" rx="16" ry="16" width={cardWidth} height="380" />
        
        {/* Header */}
        <Rect x="20" y="20" rx="4" ry="4" width="180" height="20" />
        <Rect x={cardWidth - 40} y="20" rx="4" ry="4" width="20" height="20" />
        
        {/* Workplace tile 1 */}
        <Rect x="16" y="70" rx="12" ry="12" width={cardWidth - 32} height="140" />
        <Rect x="32" y="86" rx="4" ry="4" width={cardWidth * 0.6} height="16" />
        <Rect x="32" y="112" rx="4" ry="4" width={cardWidth * 0.3} height="12" />
        <Rect x="32" y="134" rx="4" ry="4" width={cardWidth * 0.5} height="12" />
        {/* Badges */}
        <Rect x="32" y="156" rx="8" ry="8" width="70" height="24" />
        <Rect x="110" y="156" rx="8" ry="8" width="90" height="24" />
        {/* Button */}
        <Rect x="32" y="186" rx="8" ry="8" width={cardWidth - 64} height="18" />
        
        {/* Workplace tile 2 */}
        <Rect x="16" y="224" rx="12" ry="12" width={cardWidth - 32} height="140" />
        <Rect x="32" y="240" rx="4" ry="4" width={cardWidth * 0.6} height="16" />
        <Rect x="32" y="266" rx="4" ry="4" width={cardWidth * 0.3} height="12" />
        <Rect x="32" y="288" rx="4" ry="4" width={cardWidth * 0.5} height="12" />
        <Rect x="32" y="310" rx="8" ry="8" width="70" height="24" />
        <Rect x="110" y="310" rx="8" ry="8" width="90" height="24" />
        <Rect x="32" y="340" rx="8" ry="8" width={cardWidth - 64} height="18" />
      </ContentLoader>
    </View>
  );
};

export const SkeletonDoctorProfile = () => {
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;
  
  return (
    <ScrollView style={styles.screenContainer} showsVerticalScrollIndicator={false}>
      <View style={{ padding: 20 }}>
        {/* Profile Card */}
        <ContentLoader
          speed={1}
          width={cardWidth}
          height={200}
          viewBox={`0 0 ${cardWidth} 200`}
          backgroundColor="#f3f3f3"
          foregroundColor="#ecebeb"
        >
          <Rect x="0" y="0" rx="16" ry="16" width={cardWidth} height="200" />
          {/* Profile photo */}
          <Circle cx="70" cy="70" r="50" />
          {/* Name and details */}
          <Rect x="20" y="140" rx="4" ry="4" width={cardWidth * 0.6} height="18" />
          <Rect x="20" y="168" rx="4" ry="4" width={cardWidth * 0.4} height="14" />
        </ContentLoader>
        
        {/* Personal Information Section */}
        <View style={{ marginTop: 20 }}>
          <ContentLoader
            speed={1}
            width={cardWidth}
            height={280}
            viewBox={`0 0 ${cardWidth} 280`}
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            <Rect x="0" y="0" rx="16" ry="16" width={cardWidth} height="280" />
            {/* Section title */}
            <Rect x="20" y="20" rx="4" ry="4" width="180" height="18" />
            {/* Form fields */}
            <Rect x="20" y="60" rx="4" ry="4" width="100" height="14" />
            <Rect x="20" y="82" rx="8" ry="8" width={cardWidth - 40} height="40" />
            <Rect x="20" y="140" rx="4" ry="4" width="100" height="14" />
            <Rect x="20" y="162" rx="8" ry="8" width={cardWidth - 40} height="40" />
            <Rect x="20" y="220" rx="4" ry="4" width="100" height="14" />
            <Rect x="20" y="242" rx="8" ry="8" width={cardWidth - 40} height="40" />
          </ContentLoader>
        </View>
        
        {/* Professional Information Section */}
        <View style={{ marginTop: 20 }}>
          <ContentLoader
            speed={1}
            width={cardWidth}
            height={280}
            viewBox={`0 0 ${cardWidth} 280`}
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            <Rect x="0" y="0" rx="16" ry="16" width={cardWidth} height="280" />
            <Rect x="20" y="20" rx="4" ry="4" width="220" height="18" />
            <Rect x="20" y="60" rx="4" ry="4" width="100" height="14" />
            <Rect x="20" y="82" rx="8" ry="8" width={cardWidth - 40} height="40" />
            <Rect x="20" y="140" rx="4" ry="4" width="100" height="14" />
            <Rect x="20" y="162" rx="8" ry="8" width={cardWidth - 40} height="40" />
            <Rect x="20" y="220" rx="4" ry="4" width="100" height="14" />
            <Rect x="20" y="242" rx="8" ry="8" width={cardWidth - 40} height="40" />
          </ContentLoader>
        </View>
        
        {/* Workplaces Section */}
        <View style={{ marginTop: 20, marginBottom: 100 }}>
          <ContentLoader
            speed={1}
            width={cardWidth}
            height={200}
            viewBox={`0 0 ${cardWidth} 200`}
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            <Rect x="0" y="0" rx="4" ry="4" width="150" height="18" />
            <Rect x="0" y="40" rx="12" ry="12" width={cardWidth} height="70" />
            <Rect x="0" y="125" rx="12" ry="12" width={cardWidth} height="70" />
          </ContentLoader>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});
