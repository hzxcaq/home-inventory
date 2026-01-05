import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Breadcrumb from '../components/Breadcrumb';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import Confirm from '../components/Confirm';
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
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', addressId: addressId });
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

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
      setToast({ message: t('pleaseEnter') + ' ' + t('roomName'), type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/rooms`, {
        ...formData,
        address: { id: addressId },
      });
      setFormData({ name: '', floorPlanData: '' });
      setToast({ message: t('addedSuccessfully'), type: 'success' });
      fetchRooms();
    } catch (error) {
      console.error('Error adding room:', error);
      setToast({ message: t('failedToAdd'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoomsBatch = async (e) => {
    e.preventDefault();
    if (!batchNames.trim()) {
      setToast({ message: t('pleaseEnter') + ' ' + t('roomName'), type: 'warning' });
      return;
    }

    const roomNameList = batchNames
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (roomNameList.length === 0) {
      setToast({ message: t('pleaseEnter') + ' ' + t('roomName'), type: 'warning' });
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
      setToast({ message: `${roomNameList.length} ${t('rooms')} ${t('addedSuccessfully')}`, type: 'success' });
      fetchRooms();
    } catch (error) {
      console.error('Error adding rooms:', error);
      setToast({ message: t('failedToAdd'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    setConfirm({
      title: t('confirmDelete'),
      message: t('confirmDelete'),
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/rooms/${id}`);
          fetchRooms();
          setToast({ message: t('deletedSuccessfully'), type: 'success' });
        } catch (error) {
          setToast({ message: t('failedToDelete'), type: 'error' });
        }
        setConfirm(null);
      },
      onCancel: () => setConfirm(null)
    });
  };

  const handleEditRoom = (room) => {
    setEditingId(room.id);
    setEditFormData({ name: room.name, addressId: room.address?.id || addressId });
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!editFormData.name) {
      setToast({ message: t('pleaseEnter') + ' ' + t('roomName'), type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/rooms/${editingId}`, {
        name: editFormData.name,
        address: { id: editFormData.addressId },
      });
      setEditingId(null);
      setToast({ message: t('updatedSuccessfully'), type: 'success' });
      fetchRooms();
    } catch (error) {
      console.error('Error updating room:', error);
      setToast({ message: t('failedToUpdate'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ name: '', addressId: addressId });
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

      <div className="rooms-header">
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + {t('addRoom')}
        </button>

        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title={t('listView')}
          >
            ☰
          </button>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title={t('gridView')}
          >
            ⊞
          </button>
        </div>
      </div>

      <div className={`rooms-list ${viewMode}-view`}>
        <h2>{t('yourRooms')}</h2>
        <div className={`rooms-container ${viewMode}-container`}>
          {rooms.map((room) => (
            <div key={room.id} className={`room-card ${viewMode}-item`}>
            {editingId === room.id ? (
              <form onSubmit={handleUpdateRoom} style={{ flex: 1 }}>
                <div className="form-group">
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder={t('roomName')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('address')}</label>
                  <select
                    value={editFormData.addressId}
                    onChange={(e) => setEditFormData({ ...editFormData, addressId: e.target.value })}
                  >
                    {allAddresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={loading} className="btn btn-primary">
                    {t('save')}
                  </button>
                  <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                    {t('cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="room-content">
                <div className="room-info">
                  <h3
                    className="room-name-link"
                    onClick={() => window.location.href = `/room/${room.id}/storage-locations`}
                  >
                    {room.name}
                  </h3>
                  <p className="room-address">{room.address?.name}</p>
                </div>

                <div className="room-actions">
                  <a href={`/room/${room.id}/storage-locations`} className="btn btn-secondary btn-sm">
                    {t('storageLocations')}
                  </a>
                  <a href={`/room/${room.id}/items`} className="btn btn-secondary btn-sm">
                    {t('viewItems')}
                  </a>
                  <button
                    onClick={() => handleEditRoom(room)}
                    className="btn btn-primary btn-sm"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="btn btn-danger btn-sm"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            )}
          </div>
          ))}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {confirm && (
        <Confirm
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={confirm.onCancel}
          confirmText={t('delete')}
          cancelText={t('cancel')}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsBatchMode(false);
          setFormData({ name: '', floorPlanData: '' });
          setBatchNames('');
        }}
        title={t('addRoom')}
      >
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
          <form onSubmit={(e) => {
            handleAddRoom(e);
            setIsModalOpen(false);
            setFormData({ name: '', floorPlanData: '' });
          }} className="room-form">
            <div className="form-group">
              <label>{t('roomName')} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t('roomName')}
                autoFocus
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? t('adding') : t('add')}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => {
            handleAddRoomsBatch(e);
            setIsModalOpen(false);
            setBatchNames('');
          }} className="room-form">
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
      </Modal>
    </div>
  );
}
