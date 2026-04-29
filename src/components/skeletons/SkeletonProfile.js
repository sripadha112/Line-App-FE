import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import ContentLoader, { Rect, Circle } from 'react-content-loader/native';

export const SkeletonProfileHeader = () => {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.container}>
      <ContentLoader
        speed={1}
        width={width - 40}
        height={150}
        viewBox={`0 0 ${width - 40} 150`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        {/* Avatar */}
        <Circle cx={(width - 40) / 2} cy="50" r="40" />
        
        {/* Name */}
        <Rect x={(width - 40 - 180) / 2} y="105" rx="4" ry="4" width="180" height="16" />
        
        {/* Email/Phone */}
        <Rect x={(width - 40 - 150) / 2} y="130" rx="3" ry="3" width="150" height="12" />
      </ContentLoader>
    </View>
  );
};

export const SkeletonProfileInfo = () => {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.container}>
      <ContentLoader
        speed={1}
        width={width - 40}
        height={320}
        viewBox={`0 0 ${width - 40} 320`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        {/* Section 1 */}
        <Rect x="0" y="15" rx="4" ry="4" width="140" height="14" />
        <Rect x="0" y="40" rx="12" ry="12" width={width - 40} height="70" />
        
        {/* Section 2 */}
        <Rect x="0" y="125" rx="4" ry="4" width="160" height="14" />
        <Rect x="0" y="150" rx="12" ry="12" width={width - 40} height="70" />
        
        {/* Section 3 */}
        <Rect x="0" y="235" rx="4" ry="4" width="120" height="14" />
        <Rect x="0" y="260" rx="12" ry="12" width={width - 40} height="50" />
      </ContentLoader>
    </View>
  );
};

export const SkeletonEditProfile = () => {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.container}>
      <ContentLoader
        speed={1}
        width={width - 40}
        height={450}
        viewBox={`0 0 ${width - 40} 450`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        {/* Avatar */}
        <Circle cx={(width - 40) / 2} cy="50" r="40" />
        
        {/* Form fields */}
        <Rect x="0" y="110" rx="4" ry="4" width="80" height="12" />
        <Rect x="0" y="130" rx="8" ry="8" width={width - 40} height="45" />
        
        <Rect x="0" y="190" rx="4" ry="4" width="80" height="12" />
        <Rect x="0" y="210" rx="8" ry="8" width={width - 40} height="45" />
        
        <Rect x="0" y="270" rx="4" ry="4" width="80" height="12" />
        <Rect x="0" y="290" rx="8" ry="8" width={width - 40} height="45" />
        
        {/* Save button */}
        <Rect x="0" y="360" rx="10" ry="10" width={width - 40} height="50" />
      </ContentLoader>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});
