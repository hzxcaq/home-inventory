import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { searchAPI, itemPhotoAPI } from '../services/api';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';

const { width } = Dimensions.get('window');

export default function SearchScreen({ navigation }) {
  const { t } = useTranslation();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Recent searches
  const [recentSearches, setRecentSearches] = useState([
    'Kitchen items',
    'Electronics',
    'Books',
    'Clothes',
  ]);

  // Popular categories
  const [popularCategories] = useState([
    { name: t('electronics'), icon: '📱', query: 'electronics' },
    { name: t('kitchen'), icon: '🍳', query: 'kitchen' },
    { name: t('books'), icon: '📚', query: 'books' },
    { name: t('clothes'), icon: '👕', query: 'clothes' },
    { name: t('tools'), icon: '🔧', query: 'tools' },
    { name: t('toys'), icon: '🧸', query: 'toys' },
  ]);

  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const response = await searchAPI.global(query);
      setSearchResults(response.data);

      // Add to recent searches if not already there
      if (!recentSearches.includes(query)) {
        setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('searchFailed'),
      });
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [recentSearches, t]);

  const handleSearchQueryChange = (query) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const handleRecentSearchPress = (query) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const handleCategoryPress = (category) => {
    setSearchQuery(category.query);
    performSearch(category.query);
  };

  const navigateToItem = (item) => {
    navigation.navigate('ItemDetail', { itemId: item.id });
  };

  const renderSearchResult = ({ item }) => {
    const isItem = item.type === 'item';
    const isRoom = item.type === 'room';
    const isStorageLocation = item.type === 'storage_location';

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => {
          if (isItem) {
            navigateToItem(item);
          } else if (isRoom) {
            navigation.navigate('StorageLocationList', { roomId: item.id });
          } else if (isStorageLocation) {
            navigation.navigate('ItemList', { storageLocationId: item.id });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.resultContent}>
          {/* Type indicator */}
          <View style={[styles.typeIndicator,
            isItem && styles.itemIndicator,
            isRoom && styles.roomIndicator,
            isStorageLocation && styles.locationIndicator
          ]}>
            <Text style={styles.typeText}>
              {isItem ? t('item') : isRoom ? t('room') : t('storageLocation')}
            </Text>
          </View>

          {/* Main content */}
          <View style={styles.resultMain}>
            <Text style={styles.resultName}>{item.name}</Text>

            {item.description && (
              <Text style={styles.resultDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {/* Location path */}
            <Text style={styles.locationPath}>
              {item.locationPath}
            </Text>

            {/* Item-specific info */}
            {isItem && item.quantity && (
              <Text style={styles.quantityInfo}>
                {t('quantity')}: {item.quantity}
              </Text>
            )}
          </View>

          {/* Item photo */}
          {isItem && item.photoPath && (
            <Image
              source={{ uri: `http://10.0.2.2:8080${item.photoPath}` }}
              style={styles.resultPhoto}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecentSearch = ({ item }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => handleRecentSearchPress(item)}
    >
      <Text style={styles.recentSearchIcon}>🕒</Text>
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchQueryChange}
          placeholder={t('searchEverything')}
          showResults={false} // Don't show modal results, we handle them here
        />
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06b6d4" />
          <Text style={styles.loadingText}>{t('searching')}</Text>
        </View>
      )}

      {/* Search Results */}
      {hasSearched && !loading && (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {searchResults.length > 0
                ? t('searchResultsCount', { count: searchResults.length })
                : t('noResultsFound')
              }
            </Text>
          </View>

          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon="🔍"
                title={t('noResultsFound')}
                description={t('tryDifferentKeywords')}
              />
            }
          />
        </>
      )}

      {/* Default state - Recent searches and categories */}
      {!hasSearched && !loading && (
        <View style={styles.defaultContent}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('recentSearches')}</Text>
              <FlatList
                data={recentSearches}
                renderItem={renderRecentSearch}
                keyExtractor={(item, index) => `recent-${index}`}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* Popular Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('popularCategories')}</Text>
            <FlatList
              data={popularCategories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.query}
              numColumns={2}
              columnWrapperStyle={styles.categoryRow}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  resultsHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resultsList: {
    padding: 16,
    paddingBottom: 32,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    alignSelf: 'flex-start',
  },
  itemIndicator: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#06b6d4',
  },
  roomIndicator: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  locationIndicator: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  resultMain: {
    flex: 1,
    marginRight: 12,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  locationPath: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  quantityInfo: {
    fontSize: 12,
    color: '#06b6d4',
    fontWeight: '500',
  },
  resultPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  defaultContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentSearchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  recentSearchText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 48) / 2, // 2 columns with gaps
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
