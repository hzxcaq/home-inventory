import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { itemAPI, itemPhotoAPI, roomAPI, storageLocationAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2列布局，考虑padding

export default function ItemListScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { roomId } = route.params || {};

  const [items, setItems] = useState([]);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'list' or 'grid'
  const [itemPhotos, setItemPhotos] = useState({});

  // 页面聚焦时刷新数据
  useFocusEffect(
    useCallback(() => {
      if (roomId) {
        fetchRoom();
        fetchItems();
      }
    }, [roomId])
  );

  const fetchRoom = async () => {
    try {
      const response = await roomAPI.getById(roomId);
      setRoom(response.data);
    } catch (error) {
      console.error('Error fetching room:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemAPI.getAll();
      const roomItems = response.data.filter(
        (item) => item.storageLocation?.room?.id === parseInt(roomId)
      );
      setItems(roomItems);

      // 获取每个物品的照片
      roomItems.forEach(item => fetchItemPhotos(item.id));
    } catch (error) {
      console.error('Error fetching items:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('failedToLoad'),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchItemPhotos = async (itemId) => {
    try {
      const response = await itemPhotoAPI.getByItemId(itemId);
      setItemPhotos(prev => ({ ...prev, [itemId]: response.data }));
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleDeleteItem = (item) => {
    Alert.alert(
      t('confirmDelete'),
      t('confirmDelete'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await itemAPI.delete(item.id);
              Toast.show({
                type: 'success',
                text1: t('success'),
                text2: t('deletedSuccessfully'),
              });
              fetchItems();
            } catch (error) {
              console.error('Error deleting item:', error);
              Toast.show({
                type: 'error',
                text1: t('error'),
                text2: t('failedToDelete'),
              });
            }
          },
        },
      ]
    );
  };

  const handleDeletePhoto = (photoId, itemId) => {
    Alert.alert(
      t('confirmDelete'),
      t('confirmDelete'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await itemPhotoAPI.delete(photoId);
              Toast.show({
                type: 'success',
                text1: t('success'),
                text2: t('deletedSuccessfully'),
              });
              fetchItemPhotos(itemId);
            } catch (error) {
              console.error('Error deleting photo:', error);
              Toast.show({
                type: 'error',
                text1: t('error'),
                text2: t('failedToDelete'),
              });
            }
          },
        },
      ]
    );
  };

  const navigateToItemDetail = (item) => {
    navigation.navigate('ItemDetail', { item, roomId });
  };

  const navigateToAddItem = () => {
    navigation.navigate('AddItem', { roomId });
  };

  const renderGridItem = ({ item }) => {
    const photos = itemPhotos[item.id] || [];
    const mainPhoto = photos.length > 0 ? photos[0] : null;

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => navigateToItemDetail(item)}
      >
        <View style={styles.gridImageContainer}>
          {mainPhoto ? (
            <Image
              source={{ uri: `http://10.0.2.2:8080/uploads/${mainPhoto.photoPath}` }}
              style={styles.gridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>📦</Text>
            </View>
          )}
          {photos.length > 1 && (
            <View style={styles.photoCount}>
              <Text style={styles.photoCountText}>+{photos.length - 1}</Text>
            </View>
          )}
        </View>

        <View style={styles.gridContent}>
          <Text style={styles.gridItemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.gridItemLocation} numberOfLines={1}>
            {item.storageLocation?.name}
          </Text>
          <Text style={styles.gridItemQuantity}>
            {t('quantity')}: {item.quantity}
          </Text>
        </View>

        <View style={styles.gridActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigateToItemDetail(item)}
          >
            <Text style={styles.editButtonText}>{t('edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }) => {
    const photos = itemPhotos[item.id] || [];

    return (
      <View style={styles.listCard}>
        <View style={styles.listContent}>
          <View style={styles.listInfo}>
            <TouchableOpacity onPress={() => navigateToItemDetail(item)}>
              <Text style={styles.listItemName}>{item.name}</Text>
            </TouchableOpacity>
            {item.description && (
              <Text style={styles.listItemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.listItemQuantity}>
              {t('quantity')}: {item.quantity}
            </Text>
            <Text style={styles.listItemLocation}>
              {item.storageLocation?.name}
            </Text>
          </View>

          <View style={styles.listPhotosSection}>
            {photos.length > 0 ? (
              <View style={styles.listPhotosPreview}>
                {photos.slice(0, 3).map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.listPhotoContainer}
                    onLongPress={() => handleDeletePhoto(photo.id, item.id)}
                  >
                    <Image
                      source={{ uri: `http://10.0.2.2:8080/uploads/${photo.photoPath}` }}
                      style={styles.listPhoto}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
                {photos.length > 3 && (
                  <View style={styles.morePhotos}>
                    <Text style={styles.morePhotosText}>+{photos.length - 3}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noPhotosPlaceholder}>
                <Text style={styles.noPhotosText}>{t('noPhotos')}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.listActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigateToItemDetail(item)}
          >
            <Text style={styles.editButtonText}>{t('edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item)}
          >
            <Text style={styles.deleteButtonText}>{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={navigateToAddItem}>
          <Text style={styles.addButtonText}>+ {t('addItem')}</Text>
        </TouchableOpacity>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewButtonText, viewMode === 'list' && styles.activeViewButtonText]}>
              ☰
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'grid' && styles.activeViewButton]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={[styles.viewButtonText, viewMode === 'grid' && styles.activeViewButtonText]}>
              ⊞
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {room && (
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>
            {room.address?.name} > {room.name} > {t('items')}
          </Text>
        </View>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon="📦"
          title={t('noItems')}
          description={t('addFirstItem')}
          buttonText={t('addItem')}
          onButtonPress={navigateToAddItem}
        />
      ) : (
        <FlatList
          data={items}
          renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // 强制重新渲染当视图模式改变时
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeViewButton: {
    backgroundColor: '#06b6d4',
  },
  viewButtonText: {
    fontSize: 16,
    color: '#666',
  },
  activeViewButtonText: {
    color: '#fff',
  },
  breadcrumb: {
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#0891b2',
    fontStyle: 'italic',
  },
  listContainer: {
    padding: 16,
  },
  // Grid View Styles
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 4,
    width: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridImageContainer: {
    position: 'relative',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  noImageText: {
    fontSize: 32,
  },
  photoCount: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  gridContent: {
    padding: 12,
  },
  gridItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  gridItemLocation: {
    fontSize: 12,
    color: '#06b6d4',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  gridItemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  gridActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  // List View Styles
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  listInfo: {
    flex: 1,
    marginRight: 16,
  },
  listItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#06b6d4',
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  listItemQuantity: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
  },
  listItemLocation: {
    fontSize: 12,
    color: '#06b6d4',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  listPhotosSection: {
    width: 120,
  },
  listPhotosPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  listPhotoContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e0f2fe',
  },
  listPhoto: {
    width: '100%',
    height: '100%',
  },
  morePhotos: {
    width: 36,
    height: 36,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#06b6d4',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 10,
    color: '#06b6d4',
    fontWeight: '600',
  },
  noPhotosPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotosText: {
    fontSize: 10,
    color: '#adb5bd',
    textAlign: 'center',
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});