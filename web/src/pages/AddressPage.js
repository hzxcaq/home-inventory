import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './AddressPage.css';

const API_BASE_URL = 'http://localhost:8080/api';

export default function AddressPage() {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert(t('pleaseEnter') + ' ' + t('addressName'));
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/addresses`, formData);
      setFormData({ name: '', address: '' });
      alert(t('addedSuccessfully'));
      fetchAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
      alert(t('failedToAdd'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/addresses`);
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`${API_BASE_URL}/addresses/${id}`);
        fetchAddresses();
        alert(t('deletedSuccessfully'));
      } catch (error) {
        alert(t('failedToDelete'));
      }
    }
  };

  React.useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <div className="address-page">
      <h1>{t('manageAddresses')}</h1>

      <form onSubmit={handleAddAddress} className="address-form">
        <div className="form-group">
          <label>{t('addressName')} *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t('addressName')}
          />
        </div>

        <div className="form-group">
          <label>{t('address')}</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder={t('address')}
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? t('adding') : t('addAddress')}
        </button>
      </form>

      <div className="addresses-list">
        <h2>{t('yourAddresses')}</h2>
        {addresses.map((address) => (
          <div key={address.id} className="address-item">
            <div>
              <h3>{address.name}</h3>
              <p>{address.address}</p>
            </div>
            <button
              onClick={() => handleDeleteAddress(address.id)}
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
