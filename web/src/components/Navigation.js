import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import GlobalSearch from './GlobalSearch';
import './Navigation.css';

export default function Navigation() {
  const { t } = useTranslation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          {t('appName')}
        </Link>

        <div className="navbar-center">
          <GlobalSearch />
        </div>

        <div className="navbar-right">
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/" className="nav-link">
                {t('home')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/addresses" className="nav-link">
                {t('addresses')}
              </Link>
            </li>
          </ul>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
