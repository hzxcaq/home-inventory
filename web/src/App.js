import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import AddressPage from './pages/AddressPage';
import RoomPage from './pages/RoomPage';
import StorageLocationPage from './pages/StorageLocationPage';
import ItemPage from './pages/ItemPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/addresses" element={<AddressPage />} />
            <Route path="/address/:id/rooms" element={<RoomPage />} />
            <Route path="/room/:id/storage-locations" element={<StorageLocationPage />} />
            <Route path="/room/:id/items" element={<ItemPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
