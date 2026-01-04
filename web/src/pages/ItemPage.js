import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Breadcrumb from '../components/Breadcrumb';
import Modal from '../components/Modal';
import './ItemPage.css';

const API_BASE_URL = 'http://localhost:8080/api';

export default function ItemPage() {
  const { t } = useTranslation();
  const { id: roomId } = useParams();
  const [items, setItems] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [room, setRoom] = useState(null);
  const [allAddresses, setAllAddresses] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    storageLocationId: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemPhotos, setItemPhotos] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLocationData, setNewLocationData] = useState({ name: '', type: '' });
  const [addingLocation, setAddingLocation] = useState(false);

  useEffect(() => {
    fetchRoom();
    fetchStorageLocations();
    fetchItems();
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

  const fetchStorageLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/storage-locations/room/${roomId}`);
      setStorageLocations(response.data);
      if (response.data.length > 0) {
        setFormData((prev) => ({ ...prev, storageLocationId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching storage locations:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/items`);
      const roomItems = response.data.filter(
        (item) => item.storageLocation?.room?.id === parseInt(roomId)
      );
      setItems(roomItems);

      // Fetch photos for each item
      roomItems.forEach(item => fetchItemPhotos(item.id));
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchItemPhotos = async (itemId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/item-photos/item/${itemId}`);
      setItemPhotos(prev => ({ ...prev, [itemId]: response.data }));
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.storageLocationId) {
      alert(t('pleaseEnter') + ' ' + t('itemName'));
      return;
    }

    setLoading(true);
    try {
      // First create the item
      const itemResponse = await axios.post(`${API_BASE_URL}/items`, {
        name: formData.name,
        description: formData.description,
        quantity: parseInt(formData.quantity),
        storageLocation: { id: formData.storageLocationId },
      });

      const newItemId = itemResponse.data.id;

      // Then upload photos if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const photoFormData = new FormData();
          photoFormData.append('file', file);
          await axios.post(`${API_BASE_URL}/item-photos/upload/${newItemId}`, photoFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      }

      setFormData({ name: '', description: '', quantity: 1, storageLocationId: formData.storageLocationId });
      setSelectedFiles([]);
      alert(t('addedSuccessfully'));
      fetchItems();
    } catch (error) {
      console.error('Error adding item:', error);
      alert(t('failedToAdd'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`${API_BASE_URL}/items/${id}`);
        fetchItems();
        alert(t('deletedSuccessfully'));
      } catch (error) {
        alert(t('failedToDelete'));
      }
    }
  };

  const handlePhotoUpload = async (e, itemId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingPhoto(true);
    try {
      await axios.post(`${API_BASE_URL}/item-photos/upload/${itemId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(t('uploadedSuccessfully'));
      fetchItemPhotos(itemId);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(t('failedToUpload'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId, itemId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`${API_BASE_URL}/item-photos/${photoId}`);
        alert(t('deletedSuccessfully'));
        fetchItemPhotos(itemId);
      } catch (error) {
        alert(t('failedToDelete'));
      }
    }
  };

  const handleQuickAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocationData.name) {
      alert(t('pleaseEnter') + ' ' + t('locationName'));
      return;
    }

    setAddingLocation(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/storage-locations`, {
        ...newLocationData,
        room: { id: roomId },
      });

      // Refresh storage locations list
      await fetchStorageLocations();

      // Set the newly created location as selected
      setFormData((prev) => ({ ...prev, storageLocationId: response.data.id }));

      // Close modal and reset form
      setIsModalOpen(false);
      setNewLocationData({ name: '', type: '' });
      alert(t('addedSuccessfully'));
    } catch (error) {
      console.error('Error adding location:', error);
      alert(t('failedToAdd'));
    } finally {
      setAddingLocation(false);
    }
  };

  return (
    <div className="item-page">
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
                path: `/room/${r.id}/items`,
                current: r.id === parseInt(roomId)
              }))
            },
            { label: t('items'), link: null }
          ]}
        />
      )}
      <h1>{t('items')}</h1>

      <form onSubmit={handleAddItem} className="item-form">
        <div className="form-group">
          <label>{t('itemName')} *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t('itemName')}
          />
        </div>

        <div className="form-group">
          <label>{t('description')}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder={t('description')}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>{t('quantity')}</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            min="1"
          />
        </div>

        <div className="form-group">
          <label>{t('storageLocations')} *</label>
          <div className="select-with-button">
            <select
              name="storageLocationId"
              value={formData.storageLocationId}
              onChange={handleInputChange}
            >
              {storageLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn btn-secondary btn-add-location"
            >
              + {t('addLocation')}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>{t('photos')} ({t('optional')})</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            id="photo-input"
            style={{ display: 'none' }}
          />
          <label htmlFor="photo-input" className="btn btn-secondary">
            {t('selectFile')}
          </label>
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <p>{selectedFiles.length} {t('photos')} {t('selected')}</p>
              <div className="file-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="btn btn-danger btn-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? t('adding') : t('addItem')}
        </button>
      </form>

      <div className="items-list">
        <h2>{t('itemsList')}</h2>
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <div className="item-info">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p className="item-quantity">{t('quantity')}: {item.quantity}</p>

              <div className="item-photos">
                <h4>{t('photos')}</h4>
                <div className="photos-grid">
                  {itemPhotos[item.id] && itemPhotos[item.id].length > 0 ? (
                    itemPhotos[item.id].map((photo) => (
                      <div key={photo.id} className="photo-item">
                        <img
                          src={`${API_BASE_URL.replace('/api', '')}/uploads/${photo.photoPath}`}
                          alt={item.name}
                        />
                        <button
                          onClick={() => handleDeletePhoto(photo.id, item.id)}
                          className="btn btn-danger btn-sm"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="no-photos">{t('noPhotos')}</p>
                  )}
                </div>
                <div className="photo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, item.id)}
                    id={`photo-upload-${item.id}`}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor={`photo-upload-${item.id}`} className="btn btn-secondary">
                    {uploadingPhoto ? t('uploading') : t('uploadPhoto')}
                  </label>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDeleteItem(item.id)}
              className="btn btn-danger"
            >
              {t('delete')}
            </button>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewLocationData({ name: '', type: '' });
        }}
        title={t('addLocation')}
      >
        <form onSubmit={handleQuickAddLocation}>
          <div className="form-group">
            <label>{t('locationName')} *</label>
            <input
              type="text"
              value={newLocationData.name}
              onChange={(e) => setNewLocationData({ ...newLocationData, name: e.target.value })}
              placeholder={t('locationName')}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>{t('type')}</label>
            <input
              type="text"
              value={newLocationData.type}
              onChange={(e) => setNewLocationData({ ...newLocationData, type: e.target.value })}
              placeholder={t('type')}
            />
          </div>

          <button type="submit" disabled={addingLocation} className="btn btn-primary">
            {addingLocation ? t('adding') : t('add')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
