import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import Modal from 'react-native-modal';
import { TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { storageLocationAPI, roomAPI, addressAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const STORAGE_TYPES = [
  'Cabinet',
  'Drawer',
  'Shelf',
  'Closet',
  'Box',
  'Container',
  'Rack',
  'Other'
];

export default function StorageLocationListScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { roomId } = route.params || {};

  // Data state
  const [storageLocations, setStorageLocations] = useState([]);
  const [room, setRoom] = useState(null);
  const [address, setAddress] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Cabinet',
    positionX: '',
    positionY: '',
  });

  useEffect(() => {
    if (roomId) {
      fetchData();
    }
  }, [roomId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRoom(),
        fetchStorageLocations(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('failedToLoadData'),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoom = async () => {
    try {
      const response = await roomAPI.getById(roomId);
      setRoom(response.data);

      // Fetch address info
      const addressResponse = await addressAPI.getById(response.data.addressId);
      setAddress(addressResponse.data);

      // Update navigation title
      navigation.setOptions({
        title: `${response.data.name} - ${t('storageLocations')}`,
      });
    } catch (error) {
      console.error('Error fetching room:', error);
    }
  };

  const fetchStorageLocations = async () => {
    try {
      const response = await storageLocationAPI.getByRoom(roomId);
      setStorageLocations(response.data);
    } catch (error) {
      console.error('Error fetching storage locations:', error);
      throw error;
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchStorageLocations();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('failedToRefresh'),
      });
    } finally {
      setRefreshing(false);
    }
  }, [roomId]);

  const openModal = (location = null) => {
    setEditingLocation(location);
    setFormData({
      name: location?.name || '',
      description: location?.description || '',
      type: location?.type || 'Cabinet',
      positionX: location?.positionX?.toString() || '',
      positionY: location?.positionY?.toString() || '',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingLocation(null);
    setFormData({
      name: '',
      description: '',
      type: 'Cabinet',
      positionX: '',
      positionY: '',
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('storageLocationNameRequired'),
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const locationData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        positionX: formData.positionX ? parseFloat(formData.positionX) : null,
        positionY: formData.positionY ? parseFloat(formData.positionY) : null,
        roomId: roomId,
      };

      if (editingLocation) {
        await storageLocationAPI.update(editingLocation.id, locationData);
        Toast.show({
          type: 'success',
          text1: t('success'),
          text2: t('storageLocationUpdated'),
        });
      } else {
        await storageLocationAPI.create(locationData);
        Toast.show({
          type: 'success',
          text1: t('success'),
          text2: t('storageLocationCreated'),
        });
      }

      await fetchStorageLocations();
      closeModal();
    } catch (error) {
      console.error('Error saving storage location:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: editingLocation ? t('failedToUpdateStorageLocation') : t('failedToCreateStorageLocation'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (location) => {
    Alert.alert(
      t('deleteStorageLocation'),
      t('confirmDeleteStorageLocation', { name: location.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await storageLocationAPI.delete(location.id);
              Toast.show({
                type: 'success',
                text1: t('success'),
                text2: t('storageLocationDeleted'),
              });
              await fetchStorageLocations();
            } catch (error) {
              console.error('Error deleting storage location:', error);
              Toast.show({
                type: 'error',
                text1: t('error'),
                text2: t('failedToDeleteStorageLocation'),
              });
            }
          },
        },
      ]
    );
  };

  const navigateToItems = (location) => {
    navigation.navigate('ItemList', { storageLocationId: location.id });
  };

  const renderLocationCard = ({ item: location }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigateToItems(location)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationType}>{location.type}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openModal(location)}
            >
              <Text style={styles.editButtonText}>{t('edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(location)}
            >
              <Text style={styles.deleteButtonText}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {location.description && (
          <Text style={styles.locationDescription}>{location.description}</Text>
        )}

        {(location.positionX !== null || location.positionY !== null) && (
          <Text style={styles.positionInfo}>
            {t('position')}: ({location.positionX || 0}, {location.positionY || 0})
          </Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.breadcrumb}>
            {address?.name} • {room?.name}
          </Text>
          <Text style={styles.navigateHint}>
            {t('tapToViewItems')} →
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <LoadingSpinner text={t('loadingStorageLocations')} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {room ? `${room.name} - ${t('storageLocations')}` : t('storageLocations')}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Text style={styles.addButtonText}>+ {t('addLocation')}</Text>
        </TouchableOpacity>
      </View>

      {/* Storage Location List */}
      <FlatList
        data={storageLocations}
        renderItem={renderLocationCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#06b6d4']}
            tintColor="#06b6d4"
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="📦"
            title={t('noStorageLocations')}
            description={t('noStorageLocationsDescription')}
            buttonText={t('addFirstStorageLocation')}
            onButtonPress={() => openModal()}
          />
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={closeModal}
        onSwipeComplete={closeModal}
        swipeDirection="down"
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingLocation ? t('editStorageLocation') : t('addStorageLocation')}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>{t('locationName')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterLocationName')}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />

            <Text style={styles.label}>{t('type')} *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                style={styles.picker}
              >
                {STORAGE_TYPES.map((type) => (
                  <Picker.Item key={type} label={t(type.toLowerCase())} value={type} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>{t('description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('enterDescription')}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />

            <View style={styles.positionRow}>
              <View style={styles.positionField}>
                <Text style={styles.label}>{t('positionX')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.positionX}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, positionX: text }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.positionField}>
                <Text style={styles.label}>{t('positionY')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.positionY}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, positionY: text }))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeModal}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingLocation ? t('update') : t('create')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationInfo: {
    flex: 1,
    marginRight: 12,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationType: {
    fontSize: 14,
    color: '#06b6d4',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#06b6d4',
  },
  editButtonText: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  locationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  positionInfo: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breadcrumb: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  navigateHint: {
    fontSize: 12,
    color: '#06b6d4',
    fontWeight: '500',
  },
  // Modal styles
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area padding
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  positionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  positionField: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});