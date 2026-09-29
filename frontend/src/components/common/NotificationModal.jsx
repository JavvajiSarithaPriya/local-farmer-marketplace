import React from "react";
import "./NotificationModal.css";

const NotificationModal = ({ modal, closeModal, toasts, removeToast }) => {
  const getIcon = (type) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠️";
      case "info":
      default:
        return "ℹ️";
    }
  };

  const handleConfirm = () => {
    if (modal?.onConfirm) {
      try {
        modal.onConfirm();
      } catch (err) {
        console.error("Error in modal onConfirm:", err);
      }
    }
    closeModal();
  };

  return (
    <>
      {/* Centered Confirmation Modal */}
      {modal && (
        <div className="notification-backdrop" onClick={closeModal}>
          <div
            className="confirmation-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={`modal-icon-wrapper modal-icon-${modal.type || "success"}`}>
              {getIcon(modal.type)}
            </div>
            <h3 className="modal-title">{modal.title}</h3>
            {modal.message && <p className="modal-message">{modal.message}</p>}
            <div className="modal-actions">
              {modal.cancelText && (
                <button
                  className="modal-btn modal-btn-secondary"
                  onClick={closeModal}
                >
                  {modal.cancelText}
                </button>
              )}
              <button
                className={`modal-btn ${modal.isDanger || (modal.cancelText && (modal.type === 'warning' || modal.type === 'error')) ? 'modal-btn-danger' : 'modal-btn-primary'}`}
                onClick={handleConfirm}
                autoFocus
              >
                {modal.confirmText || "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightweight Toast Notifications Container */}
      {toasts && toasts.length > 0 && (
        <div className="toast-container" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast-item toast-${toast.type || "info"}`}
            >
              <span className="toast-icon">{getIcon(toast.type)}</span>
              <div className="toast-content">{toast.message}</div>
              <button
                className="toast-close-btn"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default NotificationModal;
