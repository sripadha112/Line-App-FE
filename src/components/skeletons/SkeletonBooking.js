import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import ContentLoader, { Rect, Circle } from 'react-content-loader/native';

export const SkeletonDoctorSearch = () => {
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {/* Doctor card 1 */}
        <View style={{ marginBottom: 16 }}>
          <ContentLoader
            speed={1}
            width={cardWidth}
            height={150}
            viewBox={`0 0 ${cardWidth} 150`}
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            {/* Card background */}
            <Rect x="0" y="0" rx="12" ry="12" width={cardWidth} height="150" />
            
            {/* Doctor avatar circle */}
            <Circle cx="35" cy="35" r="25" />
            
            {/* Doctor name and verified badge */}
            <Rect x="75" y="15" rx="4" ry="4" width={cardWidth * 0.4} height="16" />
            <Rect x={cardWidth * 0.55} y="15" rx="10" ry="10" width="70" height="20" />
            
            {/* Specialization */}
            <Rect x="75" y="42" rx="3" ry="3" width={cardWidth * 0.6} height="12" />
            
            {/* Clinic name */}
            <Rect x="75" y="62" rx="3" ry="3" width={cardWidth * 0.5} height="12" />
            
            {/* Address */}
            <Rect x="75" y="82" rx="3" ry="3" width={cardWidth * 0.65} height="11" />
            
            {/* Book button */}
            <Rect x={cardWidth - 70} y="110" rx="8" ry="8" width="60" height="35" />
          </ContentLoader>
        </View>

        {/* Doctor card 2 */}
        <View style={{ marginBottom: 16 }}>
          <ContentLoader
            speed={1}
            width={cardWidth}
            height={150}
            viewBox={`0 0 ${cardWidth} 150`}
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            <Rect x="0" y="0" rx="12" ry="12" width={cardWidth} height="150" />
            <Circle cx="35" cy="35" r="25" />
            <Rect x="75" y="15" rx="4" ry="4" width={cardWidth * 0.4} height="16" />
            <Rect x={cardWidth * 0.55} y="15" rx="10" ry="10" width="70" height="20" />
            <Rect x="75" y="42" rx="3" ry="3" width={cardWidth * 0.6} height="12" />
            <Rect x="75" y="62" rx="3" ry="3" width={cardWidth * 0.5} height="12" />
            <Rect x="75" y="82" rx="3" ry="3" width={cardWidth * 0.65} height="11" />
            <Rect x={cardWidth - 70} y="110" rx="8" ry="8" width="60" height="35" />
          </ContentLoader>
        </View>

        {/* Doctor card 3 */}
        <View style={{ marginBottom: 16 }}>
          <ContentLoader
            speed={1}
            width={cardWidth}
            height={150}
            viewBox={`0 0 ${cardWidth} 150`}
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            <Rect x="0" y="0" rx="12" ry="12" width={cardWidth} height="150" />
            <Circle cx="35" cy="35" r="25" />
            <Rect x="75" y="15" rx="4" ry="4" width={cardWidth * 0.4} height="16" />
            <Rect x={cardWidth * 0.55} y="15" rx="10" ry="10" width="70" height="20" />
            <Rect x="75" y="42" rx="3" ry="3" width={cardWidth * 0.6} height="12" />
            <Rect x="75" y="62" rx="3" ry="3" width={cardWidth * 0.5} height="12" />
            <Rect x="75" y="82" rx="3" ry="3" width={cardWidth * 0.65} height="11" />
            <Rect x={cardWidth - 70} y="110" rx="8" ry="8" width="60" height="35" />
          </ContentLoader>
        </View>

        {/* Doctor card 4 */}
        <View style={{ marginBottom: 16 }}>
          <ContentLoader
            speed={1}
            width={cardWidth}
            height={150}
            viewBox={`0 0 ${cardWidth} 150`}
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            <Rect x="0" y="0" rx="12" ry="12" width={cardWidth} height="150" />
            <Circle cx="35" cy="35" r="25" />
            <Rect x="75" y="15" rx="4" ry="4" width={cardWidth * 0.4} height="16" />
            <Rect x={cardWidth * 0.55} y="15" rx="10" ry="10" width="70" height="20" />
            <Rect x="75" y="42" rx="3" ry="3" width={cardWidth * 0.6} height="12" />
            <Rect x="75" y="62" rx="3" ry="3" width={cardWidth * 0.5} height="12" />
            <Rect x="75" y="82" rx="3" ry="3" width={cardWidth * 0.65} height="11" />
            <Rect x={cardWidth - 70} y="110" rx="8" ry="8" width="60" height="35" />
          </ContentLoader>
        </View>
      </View>
    </ScrollView>
  );
};

export const SkeletonDoctorSelection = ({ width = 350, height = 180 }) => {
  return (
    <View style={styles.container}>
      <ContentLoader
        speed={1}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        {/* Search bar */}
        <Rect x="20" y="15" rx="10" ry="10" width={width - 40} height="45" />
        
        {/* Filter chips */}
        <Rect x="20" y="75" rx="15" ry="15" width="70" height="30" />
        <Rect x="100" y="75" rx="15" ry="15" width="80" height="30" />
        <Rect x="190" y="75" rx="15" ry="15" width="90" height="30" />
        
        {/* Doctor card preview */}
        <Rect x="20" y="120" rx="12" ry="12" width={width - 40} height="50" />
      </ContentLoader>
    </View>
  );
};

export const SkeletonTimeSlotSelection = () => {
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;
  const slotWidth = (cardWidth - 30) / 4; // 4 slots per row with gaps
  
  return (
    <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
      <ContentLoader
        speed={1}
        width={cardWidth}
        height={400}
        viewBox={`0 0 ${cardWidth} 400`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        {/* Section title */}
        <Rect x="0" y="0" rx="4" ry="4" width="180" height="18" />
        
        {/* Date picker label */}
        <Rect x="0" y="35" rx="4" ry="4" width="200" height="14" />
        
        {/* Date picker button */}
        <Rect x="0" y="60" rx="10" ry="10" width={cardWidth} height="50" />
        
        {/* Selected date info */}
        <Rect x="0" y="125" rx="3" ry="3" width={cardWidth * 0.75} height="12" />
        
        {/* Date navigation or title */}
        <Rect x="0" y="160" rx="4" ry="4" width="180" height="16" />
        
        {/* Slot time cards - Row 1 */}
        <Rect x="0" y="195" rx="8" ry="8" width={slotWidth} height="70" />
        <Rect x={slotWidth + 10} y="195" rx="8" ry="8" width={slotWidth} height="70" />
        <Rect x={(slotWidth + 10) * 2} y="195" rx="8" ry="8" width={slotWidth} height="70" />
        <Rect x={(slotWidth + 10) * 3} y="195" rx="8" ry="8" width={slotWidth} height="70" />
        
        {/* Slot time cards - Row 2 */}
        <Rect x="0" y="275" rx="8" ry="8" width={slotWidth} height="70" />
        <Rect x={slotWidth + 10} y="275" rx="8" ry="8" width={slotWidth} height="70" />
        <Rect x={(slotWidth + 10) * 2} y="275" rx="8" ry="8" width={slotWidth} height="70" />
        <Rect x={(slotWidth + 10) * 3} y="275" rx="8" ry="8" width={slotWidth} height="70" />
      </ContentLoader>
    </View>
  );
};

export const SkeletonAppointmentList = () => {
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;
  
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
      {[1, 2, 3].map((index) => (
        <View key={index} style={{ marginBottom: 16 }}>
          <ContentLoader
            speed={1}
            width={cardWidth}
            height={160}
            viewBox={`0 0 ${cardWidth} 160`}
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            {/* Card background */}
            <Rect x="0" y="0" rx="12" ry="12" width={cardWidth} height="160" />
            
            {/* ID and status badge */}
            <Rect x="15" y="15" rx="3" ry="3" width="60" height="16" />
            <Rect x={cardWidth - 90} y="12" rx="10" ry="10" width="75" height="22" />
            
            {/* Time and date */}
            <Rect x="15" y="50" rx="3" ry="3" width={cardWidth * 0.7} height="14" />
            
            {/* Workplace */}
            <Rect x="15" y="75" rx="3" ry="3" width={cardWidth * 0.6} height="13" />
            
            {/* Queue position */}
            <Rect x="15" y="98" rx="3" ry="3" width="150" height="12" />
            
            {/* Reschedule button */}
            <Rect x="15" y="125" rx="8" ry="8" width="120" height="28" />
          </ContentLoader>
        </View>
      ))}
    </View>
  );
};

export const SkeletonRescheduleDetails = () => {
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;
  
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
      <ContentLoader
        speed={1}
        width={cardWidth}
        height={250}
        viewBox={`0 0 ${cardWidth} 250`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        {/* Section title */}
        <Rect x="0" y="10" rx="4" ry="4" width="160" height="18" />
        
        {/* Card */}
        <Rect x="0" y="40" rx="12" ry="12" width={cardWidth} height="200" />
        
        {/* ID and status badge inside card */}
        <Rect x="15" y="55" rx="3" ry="3" width="60" height="16" />
        <Rect x={cardWidth - 90} y="52" rx="10" ry="10" width="75" height="22" />
        
        {/* Detail rows */}
        <Rect x="15" y="95" rx="3" ry="3" width="120" height="12" />
        <Rect x="150" y="95" rx="3" ry="3" width={cardWidth - 180} height="12" />
        
        <Rect x="15" y="125" rx="3" ry="3" width="100" height="12" />
        <Rect x="150" y="125" rx="3" ry="3" width={cardWidth - 180} height="12" />
        
        <Rect x="15" y="155" rx="3" ry="3" width="90" height="12" />
        <Rect x="150" y="155" rx="3" ry="3" width={cardWidth - 180} height="12" />
        
        <Rect x="15" y="185" rx="3" ry="3" width="130" height="12" />
        <Rect x="150" y="185" rx="3" ry="3" width="80" height="12" />
      </ContentLoader>
    </View>
  );
};

export const SkeletonBookingConfirmation = ({ width = 350, height = 400 }) => {
  return (
    <View style={styles.container}>
      <ContentLoader
        speed={1}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        {/* Doctor info card */}
        <Rect x="20" y="15" rx="12" ry="12" width={width - 40} height="100" />
        <Circle cx="60" cy="65" r="30" />
        <Rect x="110" y="45" rx="4" ry="4" width="150" height="16" />
        <Rect x="110" y="70" rx="3" ry="3" width="100" height="12" />
        
        {/* Appointment details */}
        <Rect x="20" y="135" rx="4" ry="4" width="140" height="16" />
        <Rect x="20" y="165" rx="10" ry="10" width={width - 40} height="120" />
        
        {/* Notes section */}
        <Rect x="20" y="305" rx="4" ry="4" width="100" height="14" />
        <Rect x="20" y="330" rx="8" ry="8" width={width - 40} height="80" />
        
        {/* Confirm button */}
        <Rect x="20" y="430" rx="10" ry="10" width={width - 40} height="50" />
      </ContentLoader>
    </View>
  );
};

export const SkeletonAllBookings = ({ count = 5 }) => {
  const { width } = useWindowDimensions();
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.bookingItem}>
            <ContentLoader
              speed={1}
              width={width - 40}
              height={120}
              viewBox={`0 0 ${width - 40} 120`}
              backgroundColor="#f3f3f3"
              foregroundColor="#ecebeb"
            >
              <Rect x="0" y="0" rx="12" ry="12" width={width - 40} height="110" />
              <Circle cx="30" cy="35" r="20" />
              <Rect x="60" y="20" rx="4" ry="4" width={width * 0.4} height="14" />
              <Rect x="60" y="40" rx="3" ry="3" width={width * 0.3} height="12" />
              <Rect x="60" y="60" rx="3" ry="3" width={width * 0.25} height="10" />
              <Rect x={width - 100} y="70" rx="8" ry="8" width="60" height="24" />
            </ContentLoader>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// Workplace card skeleton for BulkReschedule, CancelDay, QuickBookingQR
export const SkeletonWorkplaceCard = ({ showMultipleButtons = false }) => {
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;
  const cardHeight = showMultipleButtons ? 150 : 130;
  
  return (
    <View style={{ marginBottom: 16 }}>
      <ContentLoader
        speed={1}
        width={cardWidth}
        height={cardHeight}
        viewBox={`0 0 ${cardWidth} ${cardHeight}`}
        backgroundColor="#e0e0e0"
        foregroundColor="#d0d0d0"
      >
        {/* Card Background */}
        <Rect x="0" y="0" rx="12" ry="12" width={cardWidth} height={cardHeight} />
        
        {/* Workplace Name */}
        <Rect x="16" y="16" rx="4" ry="4" width={cardWidth * 0.6} height="18" />
        
        {/* Workplace Type */}
        <Rect x="16" y="44" rx="4" ry="4" width={cardWidth * 0.4} height="14" />
        
        {/* Address */}
        <Rect x="16" y="68" rx="4" ry="4" width={cardWidth * 0.65} height="12" />
        
        {showMultipleButtons ? (
          <>
            {/* Three buttons side by side */}
            <Rect x="16" y="100" rx="8" ry="8" width={(cardWidth - 48) / 3} height="38" />
            <Rect x={20 + (cardWidth - 48) / 3} y="100" rx="8" ry="8" width={(cardWidth - 48) / 3} height="38" />
            <Rect x={24 + 2 * (cardWidth - 48) / 3} y="100" rx="8" ry="8" width={(cardWidth - 48) / 3} height="38" />
          </>
        ) : (
          /* Single button on the right */
          <Rect x={cardWidth - 136} y="92" rx="8" ry="8" width="120" height="32" />
        )}
      </ContentLoader>
    </View>
  );
};

// List of workplace cards
export const SkeletonWorkplaceList = ({ count = 4, showMultipleButtons = false }) => {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
      {[...Array(count)].map((_, index) => (
        <SkeletonWorkplaceCard key={index} showMultipleButtons={showMultipleButtons} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bookingItem: {
    marginVertical: 8,
  },
});
