import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import Confirm from '../components/Confirm';
import './AddressPage.css';

const API_BASE_URL = 'http://localhost:8080/api';

export default function AddressPage() {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setToast({ message: t('pleaseEnter') + ' ' + t('addressName'), type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/addresses`, formData);
      setFormData({ name: '', address: '' });
      setToast({ message: t('addedSuccessfully'), type: 'success' });
      fetchAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
      setToast({ message: t('failedToAdd'), type: 'error' });
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
    setConfirm({
      title: t('confirmDelete'),
      message: t('confirmDelete'),
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/addresses/${id}`);
          fetchAddresses();
          setToast({ message: t('deletedSuccessfully'), type: 'success' });
        } catch (error) {
          setToast({ message: t('failedToDelete'), type: 'error' });
        }
        setConfirm(null);
      },
      onCancel: () => setConfirm(null)
    });
  };

  const handleEditAddress = (address) => {
    setEditingId(address.id);
    setEditFormData({ name: address.name, address: address.address });
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    if (!editFormData.name) {
      setToast({ message: t('pleaseEnter') + ' ' + t('addressName'), type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/addresses/${editingId}`, editFormData);
      setEditingId(null);
      setToast({ message: t('updatedSuccessfully'), type: 'success' });
      fetchAddresses();
    } catch (error) {
      console.error('Error updating address:', error);
      setToast({ message: t('failedToUpdate'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ name: '', address: '' });
  };

  React.useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <div className="address-page">
      <h1>{t('manageAddresses')}</h1>

      <div className="addresses-header">
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + {t('addAddress')}
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

      <div className={`addresses-list ${viewMode}-view`}>
        <h2>{t('yourAddresses')}</h2>
        <div className={`addresses-container ${viewMode}-container`}>
          {addresses.map((address) => (
            <div key={address.id} className={`address-card ${viewMode}-item`}>
            {editingId === address.id ? (
              <form onSubmit={handleUpdateAddress} style={{ flex: 1 }}>
                <div className="form-group">
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder={t('addressName')}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    placeholder={t('address')}
                  />
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
              <div className="address-content">
                <div className="address-info">
                  <h3
                    className="address-name-link"
                    onClick={() => window.location.href = `/address/${address.id}/rooms`}
                  >
                    {address.name}
                  </h3>
                  {address.address && <p className="address-location">{address.address}</p>}
                </div>

                <div className="address-actions">
                  <a href={`/address/${address.id}/rooms`} className="btn btn-secondary btn-sm">
                    {t('manageRooms')}
                  </a>
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="btn btn-primary btn-sm"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ name: '', address: '' });
        }}
        title={t('addAddress')}
      >
        <form onSubmit={(e) => {
          handleAddAddress(e);
          setIsModalOpen(false);
          setFormData({ name: '', address: '' });
        }} className="address-form">
          <div className="form-group">
            <label>{t('addressName')} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('addressName')}
              autoFocus
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
            {loading ? t('adding') : t('add')}
          </button>
        </form>
      </Modal>

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
    </div>
  );
}
