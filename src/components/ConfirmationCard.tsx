import React from 'react';
import { AlertTriangle, X, Trash2, Check } from 'lucide-react';

interface ConfirmationCardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-900 bg-opacity-30',
          iconColor: 'text-red-400',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          borderColor: 'border-red-500'
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-900 bg-opacity-30',
          iconColor: 'text-yellow-400',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          borderColor: 'border-yellow-500'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-900 bg-opacity-30',
          iconColor: 'text-blue-400',
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
          borderColor: 'border-blue-500'
        };
      default:
        return {
          iconBg: 'bg-red-900 bg-opacity-30',
          iconColor: 'text-red-400',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          borderColor: 'border-red-500'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="absolute inset-0 data-grid"></div>
      <div className={`relative tech-card rounded-xl shadow-xl max-w-md w-full border-2 ${styles.borderColor} glow-green`}>
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center`}>
              {type === 'danger' ? (
                <Trash2 className={`w-6 h-6 ${styles.iconColor}`} />
              ) : (
                <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-300">{title}</h3>
              <p className="text-green-400 text-sm mt-1">{message}</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 tech-border text-green-300 rounded-lg hover:bg-green-800 hover:bg-opacity-30 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 ${styles.confirmBg}`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationCard;