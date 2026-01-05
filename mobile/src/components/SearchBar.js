import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { searchAPI } from '../services/api';

const SearchBar = ({ onResultPress, placeholder }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
        setIsVisible(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await searchAPI.global(searchQuery);
      setResults(response.data);
      setIsVisible(response.data.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result) => {
    setQuery('');
    setResults([]);
    setIsVisible(false);
    if (onResultPress) {
      onResultPress(result);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'item': return '📦';
      case 'room': return '🏠';
      case 'location': return '📍';
      default: return '🔍';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'item': return t('items');
      case 'room': return t('rooms');
      case 'location': return t('storageLocations');
      default: return '';
    }
  };

  const renderResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultPress(item)}
    >
      <Text style={styles.resultIcon}>{getTypeIcon(item.type)}</Text>
      <View style={styles.resultContent}>
        <Text style={styles.resultName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.resultDescription}>{item.description}</Text>
        )}
        <View style={styles.resultLocation}>
          <Text style={styles.resultType}>{getTypeLabel(item.type)}</Text>
          {item.location && (
            <Text style={styles.locationPath}> • {item.location}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder || t('searchPlaceholder')}
          placeholderTextColor="#999"
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {t('searchResults')} ({results.length})
              </Text>
            </View>
            <FlatList
              data={results}
              renderItem={renderResultItem}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchIcon: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: '70%',
    width: '90%',
  },
  resultsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06b6d4',
  },
  resultsList: {
    maxHeight: 400,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultType: {
    fontSize: 12,
    color: '#06b6d4',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '500',
  },
  locationPath: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default SearchBar;