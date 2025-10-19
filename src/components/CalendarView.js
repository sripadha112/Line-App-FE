import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { format } from 'date-fns';

export default function CalendarView({ 
  calendarData, 
  selectedDay, 
  onDaySelect 
}) {
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>📅 Your Schedule</Text>
      
      {/* Calendar Days */}
      <View style={styles.daysContainer}>
        {calendarData.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCard,
              day.isToday && styles.dayToday,
              day.isFuture && styles.dayFuture,
              selectedDay === index && styles.daySelected
            ]}
            onPress={() => onDaySelect(index)}
          >
            <Text style={[
              styles.dayName,
              day.isToday && styles.dayNameToday,
              day.isFuture && styles.dayNameFuture
            ]}>
              {day.dayName}
            </Text>
            <Text style={[
              styles.dayNumber,
              day.isToday && styles.dayNumberToday,
              day.isFuture && styles.dayNumberFuture
            ]}>
              {day.dayNumber}
            </Text>
            <View style={styles.appointmentsCount}>
              <Text style={[
                styles.countText,
                day.isToday && styles.countTextToday
              ]}>
                {day.slots?.filter(slot => slot.status === 'BOOKED').length || 0} booked
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Selected Day Slots */}
      <View style={styles.selectedDayContainer}>
        <Text style={styles.selectedDayTitle}>
          {calendarData[selectedDay]?.isToday ? 'Today' : 
           format(calendarData[selectedDay]?.date, 'MMMM d, yyyy')}
        </Text>
        
        <ScrollView 
          style={styles.slotsContainer}
          showsVerticalScrollIndicator={false}
        >
          {calendarData[selectedDay]?.slots?.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyText}>No slots available</Text>
            </View>
          ) : (
            <FlatList
              data={calendarData[selectedDay]?.slots || []}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <View style={[
                  styles.slotCard,
                  item.status === 'BOOKED' && styles.slotBooked,
                  item.status === 'AVAILABLE' && styles.slotAvailable,
                  item.status === 'CANCELLED' && styles.slotCancelled
                ]}>
                  <View style={styles.slotTime}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    <View style={[
                      styles.statusDot,
                      item.status === 'BOOKED' && styles.dotBooked,
                      item.status === 'AVAILABLE' && styles.dotAvailable,
                      item.status === 'CANCELLED' && styles.dotCancelled
                    ]} />
                  </View>
                  <View style={styles.slotDetails}>
                    <Text style={styles.patientName}>
                      {item.status === 'AVAILABLE' ? 'Available Slot' : 
                       item.status === 'CANCELLED' ? 'Cancelled' : item.patientName}
                    </Text>
                    <Text style={styles.workplace}>{item.workplace}</Text>
                    <Text style={styles.status}>{item.status}</Text>
                  </View>
                </View>
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </ScrollView>
      </View>
      
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dayCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dayToday: {
    backgroundColor: '#3498db',
  },
  dayFuture: {
    backgroundColor: '#ecf0f1',
  },
  daySelected: {
    backgroundColor: '#2980b9',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  dayNameToday: {
    color: '#fff',
  },
  dayNameFuture: {
    color: '#95a5a6',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  dayNumberToday: {
    color: '#fff',
  },
  dayNumberFuture: {
    color: '#7f8c8d',
  },
  appointmentsCount: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  countTextToday: {
    backgroundColor: '#fff',
    color: '#3498db',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  selectedDayContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  selectedDayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  slotsContainer: {
    maxHeight: 400,
  },
  emptyDay: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#95a5a6',
  },
  slotBooked: {
    borderLeftColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  slotAvailable: {
    borderLeftColor: '#27ae60',
    backgroundColor: '#f0f9f4',
  },
  slotCancelled: {
    borderLeftColor: '#f39c12',
    backgroundColor: '#fefbf3',
  },
  slotTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    minWidth: 80,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#95a5a6',
  },
  dotBooked: {
    backgroundColor: '#e74c3c',
  },
  dotAvailable: {
    backgroundColor: '#27ae60',
  },
  dotCancelled: {
    backgroundColor: '#f39c12',
  },
  slotDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workplace: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: '#95a5a6',
    textTransform: 'uppercase',
  },
  bottomSpacing: {
    height: 100,
  },
});
