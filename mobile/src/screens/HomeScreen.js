import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { addressAPI, roomAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import Toast from 'react-native-toast-message';

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 页面聚焦时刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const fetchAddresses = async () => {
    try {
      const response = await addressAPI.getAll();
      const addressesWithRooms = await Promise.all(
        response.data.map(async (address) => {
          try {
            const roomsResponse = await roomAPI.getByAddressId(address.id);
            return {
              ...address,
              rooms: roomsResponse.data.slice(0, 6), // 最多显示6个房间
              totalRooms: roomsResponse.data.length,
            };
          } catch (error) {
            return { ...address, rooms: [], totalRooms: 0 };
          }
        })
      );
      setAddresses(addressesWithRooms);
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

  const handleSearchResult = (result) => {
    switch (result.type) {
      case 'item':
        navigation.navigate('ItemList', {
          roomId: result.data.storageLocation?.room?.id,
        });
        break;
      case 'room':
        navigation.navigate('RoomList', {
          addressId: result.data.address?.id,
        });
        break;
      case 'location':
        navigation.navigate('StorageLocationList', {
          roomId: result.data.room?.id,
        });
        break;
    }
  };

  const navigateToRooms = (addressId) => {
    navigation.navigate('RoomList', { addressId });
  };

  const navigateToStorageLocations = (roomId) => {
    navigation.navigate('StorageLocationList', { roomId });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (addresses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <SearchBar onResultPress={handleSearchResult} />
        </View>
        <EmptyState
          icon="🏠"
          title={t('welcomeMessage')}
          description={t('getStartedDescription')}
          buttonText={t('createFirstAddress')}
          onButtonPress={() => navigation.navigate('AddressList')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar onResultPress={handleSearchResult} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('yourAddresses')}</Text>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => navigation.navigate('AddressList')}
          >
            <Text style={styles.manageButtonText}>{t('manageAddresses')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.addressesContainer}>
          {addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <TouchableOpacity
                onPress={() => navigateToRooms(address.id)}
                style={styles.addressHeader}
              >
                <Text style={styles.addressName}>{address.name}</Text>
                {address.address && (
                  <Text style={styles.addressLocation}>{address.address}</Text>
                )}
              </TouchableOpacity>

              {address.rooms.length > 0 ? (
                <View style={styles.roomsSection}>
                  <Text style={styles.roomsTitle}>{t('rooms')}</Text>
                  <View style={styles.roomsGrid}>
                    {address.rooms.map((room) => (
                      <TouchableOpacity
                        key={room.id}
                        style={styles.roomChip}
                        onPress={() => navigateToStorageLocations(room.id)}
                      >
                        <Text style={styles.roomChipText}>{room.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {address.totalRooms > 6 && (
                      <TouchableOpacity
                        style={[styles.roomChip, styles.moreRoomsChip]}
                        onPress={() => navigateToRooms(address.id)}
                      >
                        <Text style={styles.roomChipText}>
                          +{address.totalRooms - 6}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.roomChip, styles.addRoomChip]}
                      onPress={() => navigateToRooms(address.id)}
                    >
                      <Text style={styles.addRoomText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.noRoomsSection}>
                  <Text style={styles.noRoomsText}>{t('noRoomsYet')}</Text>
                  <TouchableOpacity
                    style={styles.addFirstRoomButton}
                    onPress={() => navigateToRooms(address.id)}
                  >
                    <Text style={styles.addFirstRoomText}>{t('addRoom')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.addAddressCard}
            onPress={() => navigation.navigate('AddressList')}
          >
            <Text style={styles.addAddressIcon}>+</Text>
            <Text style={styles.addAddressText}>{t('addNewAddress')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    borderBottomColor: '#e0e0e0',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  manageButton: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addressesContainer: {
    padding: 16,
    paddingTop: 0,
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
  addressHeader: {
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
  },
  roomsSection: {
    marginTop: 8,
  },
  roomsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomChip: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  roomChipText: {
    color: '#0891b2',
    fontSize: 14,
    fontWeight: '500',
  },
  moreRoomsChip: {
    backgroundColor: '#f0f9ff',
  },
  addRoomChip: {
    backgroundColor: '#06b6d4',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  addRoomText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noRoomsSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noRoomsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  addFirstRoomButton: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addFirstRoomText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addAddressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0f2fe',
    borderStyle: 'dashed',
  },
  addAddressIcon: {
    fontSize: 32,
    color: '#06b6d4',
    marginBottom: 8,
  },
  addAddressText: {
    fontSize: 16,
    color: '#06b6d4',
    fontWeight: '600',
  },
});
