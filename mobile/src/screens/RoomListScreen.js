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
import { roomAPI, addressAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function RoomListScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { addressId } = route.params || {};

  // Data state
  const [rooms, setRooms] = useState([]);
  const [address, setAddress] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    floorPlanData: '',
  });

  useEffect(() => {
    if (addressId) {
      fetchData();
    }
  }, [addressId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAddress(),
        fetchRooms(),
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

  const fetchAddress = async () => {
    try {
      const response = await addressAPI.getById(addressId);
      setAddress(response.data);

      // Update navigation title
      navigation.setOptions({
        title: `${response.data.name} - ${t('rooms')}`,
      });
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await roomAPI.getByAddress(addressId);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRooms();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('failedToRefresh'),
      });
    } finally {
      setRefreshing(false);
    }
  }, [addressId]);

  const openModal = (room = null) => {
    setEditingRoom(room);
    setFormData({
      name: room?.name || '',
      description: room?.description || '',
      floorPlanData: room?.floorPlanData || '',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingRoom(null);
    setFormData({ name: '', description: '', floorPlanData: '' });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('roomNameRequired'),
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const roomData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        floorPlanData: formData.floorPlanData.trim(),
        addressId: addressId,
      };

      if (editingRoom) {
        await roomAPI.update(editingRoom.id, roomData);
        Toast.show({
          type: 'success',
          text1: t('success'),
          text2: t('roomUpdated'),
        });
      } else {
        await roomAPI.create(roomData);
        Toast.show({
          type: 'success',
          text1: t('success'),
          text2: t('roomCreated'),
        });
      }

      await fetchRooms();
      closeModal();
    } catch (error) {
      console.error('Error saving room:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: editingRoom ? t('failedToUpdateRoom') : t('failedToCreateRoom'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (room) => {
    Alert.alert(
      t('deleteRoom'),
      t('confirmDeleteRoom', { name: room.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await roomAPI.delete(room.id);
              Toast.show({
                type: 'success',
                text1: t('success'),
                text2: t('roomDeleted'),
              });
              await fetchRooms();
            } catch (error) {
              console.error('Error deleting room:', error);
              Toast.show({
                type: 'error',
                text1: t('error'),
                text2: t('failedToDeleteRoom'),
              });
            }
          },
        },
      ]
    );
  };

  const navigateToStorageLocations = (room) => {
    navigation.navigate('StorageLocationList', { roomId: room.id });
  };

  const renderRoomCard = ({ item: room }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigateToStorageLocations(room)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.roomName}>{room.name}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openModal(room)}
            >
              <Text style={styles.editButtonText}>{t('edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(room)}
            >
              <Text style={styles.deleteButtonText}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {room.description && (
          <Text style={styles.roomDescription}>{room.description}</Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.addressInfo}>
            {address?.name} • {address?.city}
          </Text>
          <Text style={styles.navigateHint}>
            {t('tapToViewStorageLocations')} →
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <LoadingSpinner text={t('loadingRooms')} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {address ? `${address.name} - ${t('rooms')}` : t('rooms')}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Text style={styles.addButtonText}>+ {t('addRoom')}</Text>
        </TouchableOpacity>
      </View>

      {/* Room List */}
      <FlatList
        data={rooms}
        renderItem={renderRoomCard}
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
            icon="🏠"
            title={t('noRooms')}
            description={t('noRoomsDescription')}
            buttonText={t('addFirstRoom')}
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
              {editingRoom ? t('editRoom') : t('addRoom')}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>{t('roomName')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterRoomName')}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />

            <Text style={styles.label}>{t('description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('enterDescription')}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>{t('floorPlanData')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('enterFloorPlanData')}
              value={formData.floorPlanData}
              onChangeText={(text) => setFormData(prev => ({ ...prev, floorPlanData: text }))}
              multiline
              numberOfLines={2}
            />
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
                  {editingRoom ? t('update') : t('create')}
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
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
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
  roomDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressInfo: {
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
    maxHeight: '80%',
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