import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { itemPhotoAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const { width } = Dimensions.get('window');

export default function ItemDetailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { item, roomId } = route.params;

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItemPhotos();
  }, []);

  const fetchItemPhotos = async () => {
    try {
      const response = await itemPhotoAPI.getByItemId(item.id);
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = (photoId) => {
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
              fetchItemPhotos();
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

  const navigateToEdit = () => {
    navigation.navigate('AddItem', { roomId, editingItem: item });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.itemDescription}>{item.description}</Text>
          )}
          <View style={styles.itemMeta}>
            <Text style={styles.itemQuantity}>
              {t('quantity')}: {item.quantity}
            </Text>
            <Text style={styles.itemLocation}>
              {item.storageLocation?.name}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={navigateToEdit}>
          <Text style={styles.editButtonText}>{t('edit')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.photosSection}>
        <Text style={styles.sectionTitle}>{t('photos')}</Text>
        {photos.length > 0 ? (
          <View style={styles.photosGrid}>
            {photos.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoContainer}
                onLongPress={() => handleDeletePhoto(photo.id)}
              >
                <Image
                  source={{ uri: `http://10.0.2.2:8080/uploads/${photo.photoPath}` }}
                  style={styles.photo}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.deletePhotoButton}
                  onPress={() => handleDeletePhoto(photo.id)}
                >
                  <Text style={styles.deletePhotoText}>×</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noPhotosContainer}>
            <Text style={styles.noPhotosIcon}>📷</Text>
            <Text style={styles.noPhotosText}>{t('noPhotos')}</Text>
          </View>
        )}
      </View>

      <View style={styles.locationSection}>
        <Text style={styles.sectionTitle}>{t('location')}</Text>
        <View style={styles.locationPath}>
          <Text style={styles.locationText}>
            {item.storageLocation?.room?.address?.name}
          </Text>
          <Text style={styles.locationSeparator}> > </Text>
          <Text style={styles.locationText}>
            {item.storageLocation?.room?.name}
          </Text>
          <Text style={styles.locationSeparator}> > </Text>
          <Text style={styles.locationText}>
            {item.storageLocation?.name}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  itemLocation: {
    fontSize: 12,
    color: '#06b6d4',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editButton: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photosSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: (width - 80) / 3, // 3列布局
    height: (width - 80) / 3,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e0f2fe',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noPhotosContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noPhotosIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noPhotosText: {
    fontSize: 16,
    color: '#999',
  },
  locationSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
  },
  locationPath: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#06b6d4',
    fontWeight: '500',
  },
  locationSeparator: {
    fontSize: 14,
    color: '#ccc',
  },
});