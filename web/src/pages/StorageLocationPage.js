import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Breadcrumb from '../components/Breadcrumb';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import Confirm from '../components/Confirm';
import './StorageLocationPage.css';

const API_BASE_URL = 'http://localhost:8080/api';

export default function StorageLocationPage() {
  const { t } = useTranslation();
  const { id: roomId } = useParams();
  const [locations, setLocations] = useState([]);
  const [room, setRoom] = useState(null);
  const [allAddresses, setAllAddresses] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [formData, setFormData] = useState({ name: '', type: '' });
  const [batchData, setBatchData] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', type: '', roomId: roomId });
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  useEffect(() => {
    fetchRoom();
    fetchLocations();
    fetchAllAddresses();
  }, [roomId]);

  const fetchAllAddresses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/addresses`);
      setAllAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms/${roomId}`);
      setRoom(response.data);

      // Fetch all rooms for the same address
      if (response.data.address?.id) {
        const roomsResponse = await axios.get(`${API_BASE_URL}/rooms/address/${response.data.address.id}`);
        setAllRooms(roomsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching room:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/storage-locations/room/${roomId}`);
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setToast({ message: t('pleaseEnter') + ' ' + t('locationName'), type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/storage-locations`, {
        ...formData,
        room: { id: roomId },
      });
      setFormData({ name: '', type: '' });
      setToast({ message: t('addedSuccessfully'), type: 'success' });
      fetchLocations();
    } catch (error) {
      console.error('Error adding location:', error);
      setToast({ message: t('failedToAdd'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocationsBatch = async (e) => {
    e.preventDefault();
    if (!batchData.trim()) {
      setToast({ message: t('pleaseEnter') + ' ' + t('locationName'), type: 'warning' });
      return;
    }

    const locationList = batchData
      .split('\n')
      .map((line) => {
        const [name, type] = line.split('|').map((s) => s.trim());
        return { name, type: type || '' };
      })
      .filter((loc) => loc.name.length > 0);

    if (locationList.length === 0) {
      setToast({ message: t('pleaseEnter') + ' ' + t('locationName'), type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const locationsToCreate = locationList.map((loc) => ({
        name: loc.name,
        type: loc.type,
        room: { id: roomId },
      }));
      await axios.post(`${API_BASE_URL}/storage-locations/batch`, locationsToCreate);
      setBatchData('');
      setToast({ message: `${locationList.length} ${t('storageLocations')} ${t('addedSuccessfully')}`, type: 'success' });
      fetchLocations();
    } catch (error) {
      console.error('Error adding locations:', error);
      setToast({ message: t('failedToAdd'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id) => {
    setConfirm({
      title: t('confirmDelete'),
      message: t('confirmDelete'),
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/storage-locations/${id}`);
          fetchLocations();
          setToast({ message: t('deletedSuccessfully'), type: 'success' });
        } catch (error) {
          setToast({ message: t('failedToDelete'), type: 'error' });
        }
        setConfirm(null);
      },
      onCancel: () => setConfirm(null)
    });
  };

  const handleEditLocation = (location) => {
    setEditingId(location.id);
    setEditFormData({ name: location.name, type: location.type, roomId: location.room?.id || roomId });
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!editFormData.name) {
      setToast({ message: t('pleaseEnter') + ' ' + t('locationName'), type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/storage-locations/${editingId}`, {
        name: editFormData.name,
        type: editFormData.type,
        room: { id: editFormData.roomId },
      });
      setEditingId(null);
      setToast({ message: t('updatedSuccessfully'), type: 'success' });
      fetchLocations();
    } catch (error) {
      console.error('Error updating location:', error);
      setToast({ message: t('failedToUpdate'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ name: '', type: '', roomId: roomId });
  };

  return (
    <div className="storage-page">
      {room && (
        <Breadcrumb
          items={[
            {
              label: t('addresses'),
              link: '/addresses',
              dropdown: allAddresses.map(addr => ({
                id: addr.id,
                label: addr.name,
                path: `/address/${addr.id}/rooms`,
                current: addr.id === room.address?.id
              }))
            },
            {
              label: room.address?.name || '',
              link: `/address/${room.address?.id}/rooms`,
              dropdown: allRooms.map(r => ({
                id: r.id,
                label: r.name,
                path: `/room/${r.id}/storage-locations`,
                current: r.id === parseInt(roomId)
              }))
            },
            { label: t('storageLocations'), link: null }
          ]}
        />
      )}
      <h1>{t('manageStorageLocations')}</h1>

      <div className="locations-header">
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + {t('addLocation')}
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

      <div className={`locations-list ${viewMode}-view`}>
        <h2>{t('storageLocationsList')}</h2>
        <div className={`locations-container ${viewMode}-container`}>
          {locations.map((location) => (
            <div key={location.id} className={`location-card ${viewMode}-item`}>
            {editingId === location.id ? (
              <form onSubmit={handleUpdateLocation} style={{ flex: 1 }}>
                <div className="form-group">
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder={t('locationName')}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    placeholder={t('type')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('room')}</label>
                  <select
                    value={editFormData.roomId}
                    onChange={(e) => setEditFormData({ ...editFormData, roomId: e.target.value })}
                  >
                    {allRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
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
              <div className="location-content">
                <div className="location-info">
                  <h3
                    className="location-name-link"
                    onClick={() => window.location.href = `/room/${roomId}/items`}
                  >
                    {location.name}
                  </h3>
                  {location.type && <p className="location-type">{location.type}</p>}
                  <p className="location-room">{room?.name}</p>
                </div>

                <div className="location-actions">
                  <a href={`/room/${roomId}/items`} className="btn btn-secondary btn-sm">
                    {t('viewItems')}
                  </a>
                  <button
                    onClick={() => handleEditLocation(location)}
                    className="btn btn-primary btn-sm"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
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
          setFormData({ name: '', type: '' });
          setBatchData('');
        }}
        title={t('addLocation')}
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
            handleAddLocation(e);
            setIsModalOpen(false);
            setFormData({ name: '', type: '' });
          }} className="storage-form">
            <div className="form-group">
              <label>{t('locationName')} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t('locationName')}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>{t('type')}}</label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                placeholder={t('type')}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? t('adding') : t('add')}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => {
            handleAddLocationsBatch(e);
            setIsModalOpen(false);
            setBatchData('');
          }} className="storage-form">
            <div className="form-group">
              <label>{t('locationName')} ({t('nameAndType')}) *</label>
              <textarea
                value={batchData}
                onChange={(e) => setBatchData(e.target.value)}
                placeholder={t('nameAndType')}
                rows="6"
              />
              <small>{t('format')}: {t('nameAndType')}</small>
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
