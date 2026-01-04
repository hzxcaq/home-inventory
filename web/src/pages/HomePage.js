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
      const addressesData = response.data;

      // Fetch rooms for each address
      const addressesWithRooms = await Promise.all(
        addressesData.map(async (address) => {
          try {
            const roomsResponse = await axios.get(`${API_BASE_URL}/rooms/address/${address.id}`);
            return { ...address, rooms: roomsResponse.data };
          } catch (error) {
            console.error(`Error fetching rooms for address ${address.id}:`, error);
            return { ...address, rooms: [] };
          }
        })
      );

      setAddresses(addressesWithRooms);
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
              <div className="address-header">
                <h3>{address.name}</h3>
                <p className="address-detail">{address.address}</p>
              </div>

              {address.rooms && address.rooms.length > 0 ? (
                <div className="rooms-list">
                  <h4>{t('rooms')}</h4>
                  <div className="room-chips">
                    {address.rooms.slice(0, 6).map((room) => (
                      <Link
                        key={room.id}
                        to={`/room/${room.id}/items`}
                        className="room-chip"
                      >
                        {room.name}
                      </Link>
                    ))}
                    {address.rooms.length > 6 && (
                      <span className="room-chip more-rooms">
                        +{address.rooms.length - 6}
                      </span>
                    )}
                    <Link
                      to={`/address/${address.id}/rooms`}
                      className="room-chip add-room-chip"
                      title={t('addRoom')}
                    >
                      +
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="no-rooms">{t('noRoomsYet')}</p>
              )}

              <Link to={`/address/${address.id}/rooms`} className="btn btn-secondary btn-manage">
                {t('manageRooms')}
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
