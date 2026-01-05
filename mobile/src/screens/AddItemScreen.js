import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { addressAPI, roomAPI, storageLocationAPI, itemAPI, itemPhotoAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function AddItemScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { item, storageLocationId } = route.params || {};
  const isEditing = !!item;

  // Form state
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    quantity: item?.quantity?.toString() || '1',
    storageLocationId: item?.storageLocationId || storageLocationId || null,
  });

  // Selection state
  const [addresses, setAddresses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // Photo state
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      setInitialLoading(true);
      await fetchAddresses();

      if (isEditing) {
        // Load existing item photos
        await fetchItemPhotos();
        // Load the storage location hierarchy
        await loadStorageLocationHierarchy();
      }
    } catch (error) {
      console.error('Error initializing screen:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('failedToLoadData'),
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await addressAPI.getAll();
      setAddresses(response.data);

      if (response.data.length > 0 && !selectedAddressId) {
        const firstAddress = response.data[0];
        setSelectedAddressId(firstAddress.id);
        await fetchRooms(firstAddress.id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchRooms = async (addressId) => {
    try {
      const response = await roomAPI.getByAddress(addressId);
      setRooms(response.data);

      if (response.data.length > 0 && !selectedRoomId) {
        const firstRoom = response.data[0];
        setSelectedRoomId(firstRoom.id);
        await fetchStorageLocations(firstRoom.id);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchStorageLocations = async (roomId) => {
    try {
      const response = await storageLocationAPI.getByRoom(roomId);
      setStorageLocations(response.data);

      if (response.data.length > 0 && !formData.storageLocationId) {
        setFormData(prev => ({
          ...prev,
          storageLocationId: response.data[0].id
        }));
      }
    } catch (error) {
      console.error('Error fetching storage locations:', error);
    }
  };

  const fetchItemPhotos = async () => {
    try {
      const response = await itemPhotoAPI.getByItem(item.id);
      setExistingPhotos(response.data);
    } catch (error) {
      console.error('Error fetching item photos:', error);
    }
  };

  const loadStorageLocationHierarchy = async () => {
    try {
      // Find the storage location and load its hierarchy
      const storageLocation = await storageLocationAPI.getById(item.storageLocationId);
      const room = await roomAPI.getById(storageLocation.data.roomId);
      const address = await addressAPI.getById(room.data.addressId);

      setSelectedAddressId(address.data.id);
      setSelectedRoomId(room.data.id);

      await fetchRooms(address.data.id);
      await fetchStorageLocations(room.data.id);
    } catch (error) {
      console.error('Error loading storage location hierarchy:', error);
    }
  };

  const handleAddressChange = async (addressId) => {
    setSelectedAddressId(addressId);
    setSelectedRoomId(null);
    setFormData(prev => ({ ...prev, storageLocationId: null }));
    setRooms([]);
    setStorageLocations([]);

    if (addressId) {
      await fetchRooms(addressId);
    }
  };

  const handleRoomChange = async (roomId) => {
    setSelectedRoomId(roomId);
    setFormData(prev => ({ ...prev, storageLocationId: null }));
    setStorageLocations([]);

    if (roomId) {
      await fetchStorageLocations(roomId);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      t('selectPhoto'),
      t('choosePhotoSource'),
      [
        { text: t('camera'), onPress: takePhoto },
        { text: t('gallery'), onPress: pickFromGallery },
        { text: t('cancel'), style: 'cancel' },
      ]
    );
  };

  const takePhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        setSelectedPhotos(prev => [...prev, response.assets[0]]);
      }
    });
  };

  const pickFromGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 5, // Allow multiple selection
    };

    launchImageLibrary(options, (response) => {
      if (response.assets) {
        setSelectedPhotos(prev => [...prev, ...response.assets]);
      }
    });
  };

  const removePhoto = (index) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = async (photoId) => {
    Alert.alert(
      t('deletePhoto'),
      t('confirmDeletePhoto'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await itemPhotoAPI.delete(photoId);
              setExistingPhotos(prev => prev.filter(photo => photo.id !== photoId));
              Toast.show({
                type: 'success',
                text1: t('success'),
                text2: t('photoDeleted'),
              });
            } catch (error) {
              console.error('Error deleting photo:', error);
              Toast.show({
                type: 'error',
                text1: t('error'),
                text2: t('failedToDeletePhoto'),
              });
            }
          },
        },
      ]
    );
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('itemNameRequired'),
      });
      return false;
    }

    if (!formData.storageLocationId) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('storageLocationRequired'),
      });
      return false;
    }

    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('quantityRequired'),
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        quantity: parseInt(formData.quantity),
        storageLocationId: formData.storageLocationId,
      };

      let itemResponse;
      if (isEditing) {
        itemResponse = await itemAPI.update(item.id, itemData);
        Toast.show({
          type: 'success',
          text1: t('success'),
          text2: t('itemUpdated'),
        });
      } else {
        itemResponse = await itemAPI.create(itemData);
        Toast.show({
          type: 'success',
          text1: t('success'),
          text2: t('itemCreated'),
        });
      }

      // Upload new photos
      if (selectedPhotos.length > 0) {
        for (const photo of selectedPhotos) {
          const formData = new FormData();
          formData.append('file', {
            uri: photo.uri,
            type: photo.type,
            name: photo.fileName || 'photo.jpg',
          });

          await itemPhotoAPI.upload(itemResponse.data.id, formData);
        }
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving item:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: isEditing ? t('failedToUpdateItem') : t('failedToCreateItem'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06b6d4" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Item Name */}
      <Text style={styles.label}>{t('itemName')} *</Text>
      <TextInput
        style={styles.input}
        placeholder={t('enterItemName')}
        value={formData.name}
        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
      />

      {/* Description */}
      <Text style={styles.label}>{t('description')}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={t('enterDescription')}
        value={formData.description}
        onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
        multiline
        numberOfLines={3}
      />

      {/* Quantity */}
      <Text style={styles.label}>{t('quantity')} *</Text>
      <TextInput
        style={styles.input}
        placeholder="1"
        value={formData.quantity}
        onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
        keyboardType="numeric"
      />

      {/* Address Selection */}
      <Text style={styles.label}>{t('address')} *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedAddressId}
          onValueChange={handleAddressChange}
          style={styles.picker}
        >
          <Picker.Item label={t('selectAddress')} value={null} />
          {addresses.map((address) => (
            <Picker.Item
              key={address.id}
              label={`${address.name} - ${address.city}`}
              value={address.id}
            />
          ))}
        </Picker>
      </View>

      {/* Room Selection */}
      {rooms.length > 0 && (
        <>
          <Text style={styles.label}>{t('room')} *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRoomId}
              onValueChange={handleRoomChange}
              style={styles.picker}
            >
              <Picker.Item label={t('selectRoom')} value={null} />
              {rooms.map((room) => (
                <Picker.Item
                  key={room.id}
                  label={room.name}
                  value={room.id}
                />
              ))}
            </Picker>
          </View>
        </>
      )}

      {/* Storage Location Selection */}
      {storageLocations.length > 0 && (
        <>
          <Text style={styles.label}>{t('storageLocation')} *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.storageLocationId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, storageLocationId: value }))}
              style={styles.picker}
            >
              <Picker.Item label={t('selectStorageLocation')} value={null} />
              {storageLocations.map((location) => (
                <Picker.Item
                  key={location.id}
                  label={`${location.name} (${location.type})`}
                  value={location.id}
                />
              ))}
            </Picker>
          </View>
        </>
      )}

      {/* Existing Photos (Edit Mode) */}
      {isEditing && existingPhotos.length > 0 && (
        <>
          <Text style={styles.label}>{t('existingPhotos')}</Text>
          <View style={styles.photoGrid}>
            {existingPhotos.map((photo) => (
              <View key={photo.id} style={styles.photoContainer}>
                <Image
                  source={{ uri: `http://10.0.2.2:8080${photo.photoPath}` }}
                  style={styles.photoThumbnail}
                />
                <TouchableOpacity
                  style={styles.deletePhotoButton}
                  onPress={() => removeExistingPhoto(photo.id)}
                >
                  <Text style={styles.deletePhotoText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      {/* New Photos */}
      <Text style={styles.label}>{t('photos')}</Text>
      <TouchableOpacity style={styles.addPhotoButton} onPress={showPhotoOptions}>
        <Text style={styles.addPhotoText}>+ {t('addPhoto')}</Text>
      </TouchableOpacity>

      {selectedPhotos.length > 0 && (
        <View style={styles.photoGrid}>
          {selectedPhotos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
              <TouchableOpacity
                style={styles.deletePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <Text style={styles.deletePhotoText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEditing ? t('updateItem') : t('addItem')}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  addPhotoButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#06b6d4',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  addPhotoText: {
    color: '#06b6d4',
    fontSize: 16,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    width: (width - 56) / 3, // 3 columns with gaps
    height: (width - 56) / 3,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff3b30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deletePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});
