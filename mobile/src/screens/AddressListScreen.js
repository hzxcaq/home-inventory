import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { addressAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function AddressListScreen({ navigation }) {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  // 页面聚焦时刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const fetchAddresses = async () => {
    try {
      const response = await addressAPI.getAll();
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({ name: '', address: '' });
    setIsModalVisible(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setFormData({ name: address.name, address: address.address || '' });
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingAddress(null);
    setFormData({ name: '', address: '' });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Toast.show({
        type: 'warning',
        text1: t('warning'),
        text2: t('pleaseEnter') + ' ' + t('addressName'),
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingAddress) {
        await addressAPI.update(editingAddress.id, formData);
        Toast.show({
          type: 'success',
          text1: t('success'),
          text2: t('updatedSuccessfully'),
        });
      } else {
        await addressAPI.create(formData);
        Toast.show({
          type: 'success',
          text1: t('success'),
          text2: t('addedSuccessfully'),
        });
      }
      closeModal();
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: editingAddress ? t('failedToUpdate') : t('failedToAdd'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (address) => {
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
              await addressAPI.delete(address.id);
              Toast.show({
                type: 'success',
                text1: t('success'),
                text2: t('deletedSuccessfully'),
              });
              fetchAddresses();
            } catch (error) {
              console.error('Error deleting address:', error);
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

  const navigateToRooms = (addressId) => {
    navigation.navigate('RoomList', { addressId });
  };

  const renderAddressItem = ({ item }) => (
    <View style={styles.addressCard}>
      <TouchableOpacity
        style={styles.addressContent}
        onPress={() => navigateToRooms(item.id)}
      >
        <Text style={styles.addressName}>{item.name}</Text>
        {item.address && (
          <Text style={styles.addressLocation}>{item.address}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.addressActions}>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => navigateToRooms(item.id)}
        >
          <Text style={styles.manageButtonText}>{t('manageRooms')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.editButtonText}>{t('edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteButtonText}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ {t('addAddress')}</Text>
        </TouchableOpacity>
      </View>

      {addresses.length === 0 ? (
        <EmptyState
          icon="🏠"
          title={t('noAddresses')}
          description={t('addFirstAddress')}
          buttonText={t('addAddress')}
          onButtonPress={openAddModal}
        />
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 添加/编辑地址模态框 */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={closeModal}
        onBackButtonPress={closeModal}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAddress ? t('editAddress') : t('addAddress')}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('addressName')} *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t('addressName')}
                placeholderTextColor="#999"
                autoFocus
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('address')}</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder={t('address')}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
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
                style={[styles.submitButton, submitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? t('saving') : t('save')}
                </Text>
              </TouchableOpacity>
            </View>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  addressCard: {
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
  addressContent: {
    marginBottom: 12,
  },
  addressName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#06b6d4',
    marginBottom: 4,
  },
  addressLocation: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  manageButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  manageButtonText: {
    color: '#0891b2',
    fontSize: 12,
    fontWeight: '500',
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
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#06b6d4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});