import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
      <p className="subtitle">{t('welcomeMessage')}</p>

      {addresses.length === 0 ? (
        <div className="empty-state-guide">
          <div className="guide-icon">🏠</div>
          <h2>{t('getStarted')}</h2>
          <p className="guide-description">{t('getStartedDescription')}</p>
          <div className="guide-steps">
            <div className="step">
              <span className="step-number">1</span>
              <span className="step-text">{t('step1CreateAddress')}</span>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <span className="step-text">{t('step2CreateRooms')}</span>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <span className="step-text">{t('step3AddItems')}</span>
            </div>
          </div>
          <Link to="/addresses" className="btn btn-primary btn-large">
            {t('createFirstAddress')}
          </Link>
        </div>
      ) : (
        <div className="addresses-grid">
          {addresses.map((address) => (
            <div key={address.id} className="address-card">
              <h3>{address.name}</h3>
              <p>{address.address}</p>
              <Link to={`/address/${address.id}/rooms`} className="btn btn-primary">
                {t('rooms')}
              </Link>
            </div>
          ))}
          <Link to="/addresses" className="address-card add-new-card">
            <div className="add-icon">+</div>
            <p>{t('addNewAddress')}</p>
          </Link>
        </div>
      )}
    </div>
  );
}
