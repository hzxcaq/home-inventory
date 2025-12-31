import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './StorageLocationPage.css';

const API_BASE_URL = 'http://localhost:8080/api';

export default function StorageLocationPage() {
  const { t } = useTranslation();
  const { id: roomId } = useParams();
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({ name: '', type: '' });
  const [batchData, setBatchData] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, [roomId]);

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
      alert(t('pleaseEnter') + ' ' + t('locationName'));
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/storage-locations`, {
        ...formData,
        room: { id: roomId },
      });
      setFormData({ name: '', type: '' });
      alert(t('addedSuccessfully'));
      fetchLocations();
    } catch (error) {
      console.error('Error adding location:', error);
      alert(t('failedToAdd'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocationsBatch = async (e) => {
    e.preventDefault();
    if (!batchData.trim()) {
      alert(t('pleaseEnter') + ' ' + t('locationName'));
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
      alert(t('pleaseEnter') + ' ' + t('locationName'));
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
      alert(`${locationList.length} ${t('storageLocations')} ${t('addedSuccessfully')}`);
      fetchLocations();
    } catch (error) {
      console.error('Error adding locations:', error);
      alert(t('failedToAdd'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`${API_BASE_URL}/storage-locations/${id}`);
        fetchLocations();
        alert(t('deletedSuccessfully'));
      } catch (error) {
        alert(t('failedToDelete'));
      }
    }
  };

  return (
    <div className="storage-page">
      <h1>{t('manageStorageLocations')}</h1>

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
        <form onSubmit={handleAddLocation} className="storage-form">
          <div className="form-group">
            <label>{t('locationName')} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('locationName')}
            />
          </div>

          <div className="form-group">
            <label>{t('type')}</label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              placeholder={t('type')}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? t('adding') : t('addLocation')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleAddLocationsBatch} className="storage-form">
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

      <div className="locations-list">
        <h2>{t('storageLocationsList')}</h2>
        {locations.map((location) => (
          <div key={location.id} className="location-item">
            <div>
              <h3>{location.name}</h3>
              {location.type && <p className="location-type">{location.type}</p>}
            </div>
            <button
              onClick={() => handleDeleteLocation(location.id)}
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
