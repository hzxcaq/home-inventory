import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './HomePage.css';

const API_BASE_URL = 'http://localhost:8080/api';

export default function HomePage() {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/addresses`);
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  return (
    <div className="home-page">
      <h1>Home Inventory</h1>
      <p>{t('manageAddresses')}</p>

      <div className="addresses-grid">
        {addresses.map((address) => (
          <div key={address.id} className="address-card">
            <h3>{address.name}</h3>
            <p>{address.address}</p>
            <a href={`/address/${address.id}/rooms`} className="btn btn-primary">
              {t('rooms')}
            </a>
          </div>
        ))}
      </div>

      {addresses.length === 0 && (
        <div className="empty-state">
          <p>{t('pleaseEnter')} {t('addressName')}</p>
        </div>
      )}
    </div>
  );
}
