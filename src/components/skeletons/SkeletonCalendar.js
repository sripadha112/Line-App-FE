import React from 'react';
import { View, StyleSheet } from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';

export const SkeletonCalendar = ({ width = 350, height = 350 }) => {
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
        {/* Calendar header */}
        <Rect x="20" y="15" rx="4" ry="4" width="120" height="18" />
        <Rect x={width - 80} y="15" rx="6" ry="6" width="30" height="18" />
        <Rect x={width - 40} y="15" rx="6" ry="6" width="30" height="18" />
        
        {/* Weekday headers */}
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <Rect
            key={day}
            x={20 + day * 45}
            y="50"
            rx="3"
            ry="3"
            width="35"
            height="12"
          />
        ))}
        
        {/* Calendar grid - 5 weeks */}
        {Array.from({ length: 35 }).map((_, index) => {
          const row = Math.floor(index / 7);
          const col = index % 7;
          return (
            <Rect
              key={index}
              x={20 + col * 45}
              y={75 + row * 45}
              rx="6"
              ry="6"
              width="38"
              height="38"
            />
          );
        })}
      </ContentLoader>
    </View>
  );
};

export const SkeletonCalendarAppointments = ({ width = 350, height = 250 }) => {
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
        {/* Title */}
        <Rect x="20" y="15" rx="4" ry="4" width="160" height="16" />
        
        {/* Appointment 1 */}
        <Rect x="20" y="45" rx="8" ry="8" width={width - 40} height="60" />
        
        {/* Appointment 2 */}
        <Rect x="20" y="115" rx="8" ry="8" width={width - 40} height="60" />
        
        {/* Appointment 3 */}
        <Rect x="20" y="185" rx="8" ry="8" width={width - 40} height="60" />
      </ContentLoader>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
});
