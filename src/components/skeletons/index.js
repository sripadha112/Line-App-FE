// Export all skeleton components for easy import
export * from './SkeletonCard';
export * from './SkeletonList';
export * from './SkeletonProfile';
export * from './SkeletonCalendar';
export * from './SkeletonHome';
export * from './SkeletonBooking';

// Re-export specific skeletons for convenience
export { SkeletonDoctorSearch } from './SkeletonBooking';
export { SkeletonDoctorProfile } from './SkeletonHome';

// Generic skeleton component
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';

export const GenericSkeleton = ({ 
  height = 100, 
  style = {} 
}) => {
  const { width } = useWindowDimensions();
  return (
    <View style={[{ paddingHorizontal: 20 }, style]}>
      <ContentLoader
        speed={1}
        width={width - 40}
        height={height}
        viewBox={`0 0 ${width - 40} ${height}`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        <Rect x="0" y="0" rx="8" ry="8" width={width - 40} height={height} />
      </ContentLoader>
    </View>
  );
};
