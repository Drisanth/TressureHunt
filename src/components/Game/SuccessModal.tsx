import React from 'react';
import './Modal.css';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content success-modal">
        <div className="modal-header">
          <h2>🎉 Success!</h2>
        </div>
        
        <div className="modal-body">
          <div className="success-content">
            <div className="success-icon">✅</div>
            <p>{message}</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="success-button" onClick={onClose}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
