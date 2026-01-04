import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Breadcrumb from '../components/Breadcrumb';
import './RoomPage.css';

const API_BASE_URL = 'http://localhost:8080/api';

export default function RoomPage() {
  const { t } = useTranslation();
  const { id: addressId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [address, setAddress] = useState(null);
  const [allAddresses, setAllAddresses] = useState([]);
  const [formData, setFormData] = useState({ name: '', floorPlanData: '' });
  const [batchNames, setBatchNames] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAddress();
    fetchRooms();
    fetchAllAddresses();
  }, [addressId]);

  const fetchAllAddresses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/addresses`);
      setAllAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchAddress = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/addresses/${addressId}`);
      setAddress(response.data);
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms/address/${addressId}`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert(t('pleaseEnter') + ' ' + t('roomName'));
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/rooms`, {
        ...formData,
        address: { id: addressId },
      });
      setFormData({ name: '', floorPlanData: '' });
      alert(t('addedSuccessfully'));
      fetchRooms();
    } catch (error) {
      console.error('Error adding room:', error);
      alert(t('failedToAdd'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoomsBatch = async (e) => {
    e.preventDefault();
    if (!batchNames.trim()) {
      alert(t('pleaseEnter') + ' ' + t('roomName'));
      return;
    }

    const roomNameList = batchNames
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (roomNameList.length === 0) {
      alert(t('pleaseEnter') + ' ' + t('roomName'));
      return;
    }

    setLoading(true);
    try {
      const roomsToCreate = roomNameList.map((name) => ({
        name,
        address: { id: addressId },
      }));
      await axios.post(`${API_BASE_URL}/rooms/batch`, roomsToCreate);
      setBatchNames('');
      alert(`${roomNameList.length} ${t('rooms')} ${t('addedSuccessfully')}`);
      fetchRooms();
    } catch (error) {
      console.error('Error adding rooms:', error);
      alert(t('failedToAdd'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`${API_BASE_URL}/rooms/${id}`);
        fetchRooms();
        alert(t('deletedSuccessfully'));
      } catch (error) {
        alert(t('failedToDelete'));
      }
    }
  };

  return (
    <div className="room-page">
      {address && (
        <Breadcrumb
          items={[
            {
              label: t('addresses'),
              link: '/addresses',
              dropdown: allAddresses.map(addr => ({
                id: addr.id,
                label: addr.name,
                path: `/address/${addr.id}/rooms`,
                current: addr.id === parseInt(addressId)
              }))
            },
            { label: address.name, link: null }
          ]}
        />
      )}
      <h1>{t('manageRooms')}</h1>

      <div className="mode-toggle">
        <button
          className={`toggle-btn ${!isBatchMode ? 'active' : ''}`}
          onClick={() => setIsBatchMode(false)}
        >
          {t('singleMode')}
        </button>
        <button
          className={`toggle-btn ${isBatchMode ? 'active' : ''}`}
          onClick={() => setIsBatchMode(true)}
        >
          {t('batchMode')}
        </button>
      </div>

      {!isBatchMode ? (
        <form onSubmit={handleAddRoom} className="room-form">
          <div className="form-group">
            <label>{t('roomName')} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('roomName')}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? t('adding') : t('addRoom')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleAddRoomsBatch} className="room-form">
          <div className="form-group">
            <label>{t('roomName')} ({t('onePerLine')}) *</label>
            <textarea
              value={batchNames}
              onChange={(e) => setBatchNames(e.target.value)}
              placeholder={t('roomName')}
              rows="6"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? t('adding') : t('batchAdd')}
          </button>
        </form>
      )}

      <div className="rooms-list">
        <h2>{t('yourRooms')}</h2>
        {rooms.map((room) => (
          <div key={room.id} className="room-item">
            <div>
              <h3>{room.name}</h3>
            </div>
            <div className="room-actions">
              <a href={`/room/${room.id}/storage-locations`} className="btn btn-secondary">
                {t('storageLocations')}
              </a>
              <a href={`/room/${room.id}/items`} className="btn btn-secondary">
                {t('viewItems')}
              </a>
              <button
                onClick={() => handleDeleteRoom(room.id)}
                className="btn btn-danger"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
