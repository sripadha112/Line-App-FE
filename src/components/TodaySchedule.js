import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Card from './Card';

export default function TodaySchedule({ 
  isExpanded, 
  onToggle, 
  workplaces, 
  onViewAppointments 
}) {
  const totalAppointments = workplaces.reduce((total, wp) => total + (wp.todayAppointmentsCount || 0), 0);

  if (!isExpanded) {
    // Collapsed view - show as a simple card
    return (
      <View style={styles.container}>
        <Card
          title="📅 Today's Schedule"
          subtitle={`${workplaces.length} workplaces • ${totalAppointments} appointments`}
          onPress={onToggle}
          color="#3498db"
        />
      </View>
    );
  }

  // Expanded view - show all workplaces with header
  return (
    <View style={styles.container}>
      <View style={styles.expandedContainer}>
        <TouchableOpacity style={styles.header} onPress={onToggle}>
          <Text style={styles.title}>📅 Today's Schedule</Text>
          <Text style={styles.expandIcon}>✕</Text>
        </TouchableOpacity>
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {workplaces.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>🏥 No workplaces found</Text>
              <Text style={styles.emptySubtext}>Add hospitals or clinics to get started</Text>
            </View>
          ) : (
            workplaces.map((item, index) => (
              <View
                key={index}
                style={styles.workplaceTile}
              >
                <View style={styles.workplaceContent}>
                  <Text style={styles.workplaceName}>{item.workplaceName}</Text>
                  <Text style={styles.workplaceType}>{item.workplaceType}</Text>
                  <Text style={styles.workplaceAddress}>{item.address}</Text>
                  
                  <View style={styles.appointmentRow}>
                    <View style={styles.appointmentBadge}>
                      <Text style={styles.appointmentText}>
                        {item.todayAppointmentsCount || 0} today
                      </Text>
                    </View>
                    <View style={[styles.appointmentBadge, styles.futureBadge]}>
                      <Text style={styles.appointmentText}>
                        {item.futureAppointmentsCount || 0} upcoming
                      </Text>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => onViewAppointments(item)}
                >
                  <Text style={styles.viewButtonText}>View Appointments</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
  },
  expandedContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  expandIcon: {
    fontSize: 16,
    color: '#3498db',
  },
  scrollView: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  workplaceTile: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  workplaceContent: {
    flex: 1,
    marginBottom: 12,
  },
  workplaceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workplaceType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3498db',
    backgroundColor: '#e8f4fd',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  workplaceAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
    lineHeight: 20,
  },
  appointmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  appointmentBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  futureBadge: {
    backgroundColor: '#27ae60',
  },
  appointmentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
