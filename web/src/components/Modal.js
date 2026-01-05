import React from 'react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, zIndex = 1000 }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex }} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
