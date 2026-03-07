import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import API_BASE_URL from '../config';
import SecureStore from '../utils/secureStorage';

export default function MedicineSearchModal({ visible, onClose, onSelectMedicine }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setSearchQuery('');
      setMedicines([]);
      setError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return; // Don't search if modal is not visible
    
    // Only search if query has 3 or more characters
    if (searchQuery.length >= 3) {
      // Debounce search
      const timeoutId = setTimeout(() => {
        loadMedicines(searchQuery);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else if (searchQuery.length === 0) {
      // Clear results if search is cleared
      setMedicines([]);
      setError(null);
    }
  }, [searchQuery, visible]);

  const loadMedicines = async (query) => {
    if (!query || query.length < 3) return; // Don't search if less than 3 characters
    
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Log API URL
      console.log('🔍 API_BASE_URL:', API_BASE_URL);
      console.log('🔍 Search query:', query);
      
      const token = await SecureStore.getItemAsync('accessToken');
      console.log('🔑 Token exists:', !!token);
      
      // New API: Returns list directly, not paginated
      const url = `${API_BASE_URL}/api/medicines/search?query=${encodeURIComponent(query)}`;
      console.log('🌐 Full URL:', url);

      // Build headers - include token if available
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          console.log('⚠️ 400 Error:', errorData);
          setError(errorData.error || 'Invalid search query');
          setMedicines([]);
          return;
        }
        throw new Error(`HTTP ${response.status}: Failed to load medicines`);
      }

      const data = await response.json();
      console.log('✅ Response data type:', Array.isArray(data) ? 'Array' : typeof data);
      console.log('✅ Number of medicines:', Array.isArray(data) ? data.length : 0);
      
      // Backend returns array directly (max 20 items)
      if (Array.isArray(data)) {
        setMedicines(data);
      } else {
        console.log('⚠️ Unexpected response format:', data);
        setMedicines([]);
      }
    } catch (error) {
      console.error('❌ Error loading medicines:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      setError(`Failed: ${error.message}`);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMedicine = (medicine) => {
    onSelectMedicine(medicine);
    setSearchQuery('');
    setMedicines([]);
    setError(null);
    onClose();
  };

  const renderMedicine = ({ item }) => (
    <TouchableOpacity
      style={styles.medicineItem}
      onPress={() => handleSelectMedicine(item)}
    >
      <Text style={styles.medicineName}>{item.medicineName}</Text>
      {item.composition2 && (
        <Text style={styles.compositionHighlight}>{item.composition2}</Text>
      )}
      {item.packSize && (
        <Text style={styles.packSize}>{item.packSize}</Text>
      )}
      {item.manufacturer && (
        <Text style={styles.manufacturerHighlight}>{item.manufacturer}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Search Medicines</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Type at least 3 characters to search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <Text style={styles.minCharsText}>
              Type {3 - searchQuery.length} more character{3 - searchQuery.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Searching medicines...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={medicines}
            renderItem={renderMedicine}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery.length === 0 
                    ? '🔍 Type at least 3 characters to search for medicines' 
                    : searchQuery.length < 3 
                    ? `Type ${3 - searchQuery.length} more character${3 - searchQuery.length > 1 ? 's' : ''}...`
                    : 'No medicines found matching your search'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  medicineItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  compositionHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e91e63',
    marginBottom: 2,
  },
  packSize: {
    fontSize: 13,
    color: '#95a5a6',
    marginBottom: 2,
  },
  manufacturerHighlight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff9800',
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    lineHeight: 24,
  },
  minCharsText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
    textAlign: 'center',
  },
});
