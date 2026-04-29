import React from 'react';
import { View, StyleSheet } from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';

export const SkeletonListItem = ({ width = 350, height = 70 }) => {
  return (
    <View style={styles.itemContainer}>
      <ContentLoader
        speed={1}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        {/* Icon/Image */}
        <Rect x="15" y="15" rx="6" ry="6" width="40" height="40" />
        
        {/* Title */}
        <Rect x="65" y="18" rx="4" ry="4" width="200" height="14" />
        
        {/* Subtitle */}
        <Rect x="65" y="38" rx="3" ry="3" width="150" height="12" />
      </ContentLoader>
    </View>
  );
};

export const SkeletonList = ({ count = 5, itemHeight = 70 }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonListItem key={index} height={itemHeight} />
      ))}
    </View>
  );
};

export const SkeletonTimeSlotList = ({ width = 350 }) => {
  return (
    <View style={styles.container}>
      <ContentLoader
        speed={1}
        width={width}
        height={200}
        viewBox={`0 0 ${width} 200`}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        {/* Morning slots */}
        <Rect x="15" y="10" rx="4" ry="4" width="80" height="14" />
        <Rect x="15" y="35" rx="8" ry="8" width="70" height="35" />
        <Rect x="95" y="35" rx="8" ry="8" width="70" height="35" />
        <Rect x="175" y="35" rx="8" ry="8" width="70" height="35" />
        <Rect x="255" y="35" rx="8" ry="8" width="70" height="35" />
        
        {/* Afternoon slots */}
        <Rect x="15" y="90" rx="4" ry="4" width="90" height="14" />
        <Rect x="15" y="115" rx="8" ry="8" width="70" height="35" />
        <Rect x="95" y="115" rx="8" ry="8" width="70" height="35" />
        <Rect x="175" y="115" rx="8" ry="8" width="70" height="35" />
        
        {/* Evening slots */}
        <Rect x="15" y="165" rx="4" ry="4" width="80" height="14" />
      </ContentLoader>
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  itemContainer: {
    marginVertical: 5,
    marginHorizontal: 10,
  },
  container: {
    marginVertical: 10,
  },
});
