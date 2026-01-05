import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './GlobalSearch.css';

const API_BASE_URL = 'http://localhost:8080/api';

export default function GlobalSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const [itemsResponse, roomsResponse, locationsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/items`),
        axios.get(`${API_BASE_URL}/rooms`),
        axios.get(`${API_BASE_URL}/storage-locations`)
      ]);

      const searchResults = [];

      // Search items
      const items = itemsResponse.data.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      items.forEach(item => {
        searchResults.push({
          id: `item-${item.id}`,
          type: 'item',
          name: item.name,
          description: item.description,
          location: `${item.storageLocation?.room?.address?.name} > ${item.storageLocation?.room?.name} > ${item.storageLocation?.name}`,
          link: `/room/${item.storageLocation?.room?.id}/items`
        });
      });

      // Search rooms
      const rooms = roomsResponse.data.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      rooms.forEach(room => {
        searchResults.push({
          id: `room-${room.id}`,
          type: 'room',
          name: room.name,
          location: room.address?.name,
          link: `/address/${room.address?.id}/rooms`
        });
      });

      // Search storage locations
      const locations = locationsResponse.data.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (location.type && location.type.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      locations.forEach(location => {
        searchResults.push({
          id: `location-${location.id}`,
          type: 'location',
          name: location.name,
          description: location.type,
          location: `${location.room?.address?.name} > ${location.room?.name}`,
          link: `/room/${location.room?.id}/storage-locations`
        });
      });

      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    window.location.href = result.link;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'item': return '📦';
      case 'room': return '🏠';
      case 'location': return '📍';
      default: return '🔍';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'item': return t('items');
      case 'room': return t('rooms');
      case 'location': return t('storageLocations');
      default: return '';
    }
  };

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-container">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="search-input"
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
        />
        <div className="search-icon">🔍</div>
      </div>

      {isOpen && (
        <div className="search-results">
          {loading ? (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <span>{t('loading')}</span>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="search-results-header">
                {t('searchResults')} ({results.length})
              </div>
              <div className="search-results-list">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="search-result-item"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="result-icon">{getTypeIcon(result.type)}</div>
                    <div className="result-content">
                      <div className="result-name">{result.name}</div>
                      {result.description && (
                        <div className="result-description">{result.description}</div>
                      )}
                      <div className="result-location">
                        <span className="result-type">{getTypeLabel(result.type)}</span>
                        {result.location && (
                          <>
                            <span className="location-separator"> {t('searchIn')} </span>
                            <span className="location-path">{result.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <div className="no-results-text">{t('noResults')}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}