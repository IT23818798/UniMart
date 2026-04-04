import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'warning', show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`validation-toast ${type}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="toast-close"
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          marginLeft: '0.5rem',
          cursor: 'pointer',
          fontSize: '1rem',
          opacity: 0.8
        }}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;