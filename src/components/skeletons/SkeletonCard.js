import React from 'react';
import { View, StyleSheet } from 'react-native';
import ContentLoader, { Rect, Circle } from 'react-content-loader/native';

export const SkeletonCard = ({ width = 350, height = 120 }) => {
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
        <Rect x="15" y="15" rx="8" ry="8" width={width - 30} height={height - 30} />
      </ContentLoader>
    </View>
  );
};

export const SkeletonAppointmentCard = ({ width = 350, height = 140 }) => {
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
        {/* Card background */}
        <Rect x="15" y="10" rx="12" ry="12" width={width - 30} height={height - 20} />
        
        {/* Avatar */}
        <Circle cx="40" cy="45" r="20" />
        
        {/* Name and details */}
        <Rect x="75" y="30" rx="4" ry="4" width="150" height="15" />
        <Rect x="75" y="52" rx="3" ry="3" width="100" height="12" />
        
        {/* Time and status */}
        <Rect x="75" y="75" rx="3" ry="3" width="80" height="12" />
        <Rect x={width - 90} y="75" rx="8" ry="8" width="60" height="25" />
        
        {/* Bottom buttons */}
        <Rect x="20" y={height - 45} rx="6" ry="6" width="90" height="30" />
        <Rect x="120" y={height - 45} rx="6" ry="6" width="90" height="30" />
      </ContentLoader>
    </View>
  );
};

export const SkeletonDoctorCard = ({ width = 350, height = 160 }) => {
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
        {/* Card background */}
        <Rect x="15" y="10" rx="12" ry="12" width={width - 30} height={height - 20} />
        
        {/* Doctor avatar */}
        <Circle cx="50" cy="55" r="30" />
        
        {/* Doctor name */}
        <Rect x="95" y="35" rx="4" ry="4" width="180" height="18" />
        
        {/* Specialization */}
        <Rect x="95" y="60" rx="3" ry="3" width="120" height="14" />
        
        {/* Experience */}
        <Rect x="95" y="82" rx="3" ry="3" width="90" height="12" />
        
        {/* Rating */}
        <Rect x="25" y="105" rx="3" ry="3" width="60" height="12" />
        
        {/* Fee */}
        <Rect x="95" y="105" rx="3" ry="3" width="70" height="12" />
        
        {/* Book button */}
        <Rect x="20" y={height - 45} rx="8" ry="8" width={width - 40} height="35" />
      </ContentLoader>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 10,
  },
});
