import { createContext, useContext, useState, useCallback, useRef } from "react";
import NotificationModal from "../common/NotificationModal";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const modalTimeoutRef = useRef(null);

  const closeModal = useCallback(() => {
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }
    setModal((current) => {
      if (current?.onClose) {
        try {
          current.onClose();
        } catch (err) {
          console.error("Error in modal onClose:", err);
        }
      }
      return null;
    });
  }, []);

  const showModal = useCallback(({
    type = "success",
    title,
    message,
    confirmText = "Continue",
    cancelText = null,
    onConfirm = null,
    onClose = null,
    autoCloseMs = null,
  }) => {
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }

    setModal({
      type,
      title: title || (type === "success" ? "Success" : type === "error" ? "Error" : "Notification"),
      message,
      confirmText,
      cancelText,
      onConfirm,
      onClose,
    });

    if (autoCloseMs) {
      modalTimeoutRef.current = setTimeout(() => {
        closeModal();
      }, autoCloseMs);
    }
  }, [closeModal]);

  const showToast = useCallback(({
    type = "info",
    message,
    durationMs = 3500,
  }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, type, message };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showModal, closeModal, showToast }}>
      {children}
      <NotificationModal
        modal={modal}
        closeModal={closeModal}
        toasts={toasts}
        removeToast={removeToast}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Fallback if not inside provider
    return {
      showModal: ({ title, message }) => alert(`${title ? title + "\n" : ""}${message || ""}`),
      closeModal: () => {},
      showToast: ({ message }) => console.log("Toast:", message),
    };
  }
  return context;
};
