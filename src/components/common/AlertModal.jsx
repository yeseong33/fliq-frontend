import React from 'react';
import Button from './Button';

const AlertModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="alertdialog" aria-modal="true" aria-label={message}>
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-sm mx-4 transition-colors duration-200">
        <div className="p-6">
          <p className="text-center text-gray-900 dark:text-white text-base mb-6">
            {message}
          </p>
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              className="min-w-[100px]"
            >
              확인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;