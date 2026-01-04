import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Breadcrumb.css';

export default function Breadcrumb({ items }) {
  const { t } = useTranslation();

  return (
    <nav className="breadcrumb">
      <Link to="/" className="breadcrumb-item">
        {t('home')}
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="breadcrumb-separator">/</span>
          {item.link ? (
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
