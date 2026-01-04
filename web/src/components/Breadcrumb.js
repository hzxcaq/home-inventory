import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Breadcrumb.css';

export default function Breadcrumb({ items }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleSelect = (path) => {
    navigate(path);
    setOpenDropdown(null);
  };

  return (
    <nav className="breadcrumb">
      <Link to="/" className="breadcrumb-item">
        {t('home')}
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="breadcrumb-separator">/</span>
          {item.dropdown ? (
            <div className="breadcrumb-dropdown">
              <button
                className={`breadcrumb-item dropdown-toggle ${!item.link ? 'active' : ''}`}
                onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
              >
                {item.label}
                <span className="dropdown-arrow">▼</span>
              </button>
              {openDropdown === index && (
                <div className="dropdown-menu">
                  {item.dropdown.map((option) => (
                    <button
                      key={option.id}
                      className={`dropdown-item ${option.current ? 'current' : ''}`}
                      onClick={() => handleSelect(option.path)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : item.link ? (
            <Link to={item.link} className="breadcrumb-item">
              {item.label}
            </Link>
          ) : (
            <span className="breadcrumb-item active">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
