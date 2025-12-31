import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './ItemPage.css';

const API_BASE_URL = 'http://localhost:8080/api';

export default function ItemPage() {
  const { t } = useTranslation();
  const { id: roomId } = useParams();
  const [items, setItems] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    storageLocationId: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStorageLocations();
    fetchItems();
  }, [roomId]);

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
    } catch (error) {
      console.error('Error fetching items:', error);
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
      await axios.post(`${API_BASE_URL}/items`, {
        name: formData.name,
        description: formData.description,
        quantity: parseInt(formData.quantity),
        storageLocation: { id: formData.storageLocationId },
      });
      setFormData({ name: '', description: '', quantity: 1, storageLocationId: formData.storageLocationId });
      alert(t('addedSuccessfully'));
      fetchItems();
    } catch (error) {
      console.error('Error adding item:', error);
      alert(t('failedToAdd'));
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="item-page">
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
    </div>
  );
}
