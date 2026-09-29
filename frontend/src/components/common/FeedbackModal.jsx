import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../context/NotificationContext";
import { feedbackAPI } from "../services/api";
import "./NotificationModal.css";

const FeedbackModal = ({ order, isOpen, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const { showToast } = useNotification();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError(t("invalidRating") || "Please select a rating between 1 and 5 stars");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await feedbackAPI.submit(order.id, rating, comment);
      showToast({
        type: "success",
        message: `⭐ ${t("feedbackSubmitted") || "Feedback submitted successfully!"}`,
      });
      if (onSuccess) {
        onSuccess(order.id, result);
      }
      onClose();
    } catch (err) {
      const errMsg = err.message || t("failedSubmitFeedback") || "Failed to submit feedback";
      setError(errMsg);
      showToast({
        type: "error",
        message: `❌ ${errMsg}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="notification-backdrop" onClick={onClose}>
      <div
        className="confirmation-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: "480px", textAlign: "left" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="modal-title" style={{ margin: 0, fontSize: "1.25rem", color: "#14371f" }}>
            ⭐ {t("giveFeedback") || "Give Feedback"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "#798e7b",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          backgroundColor: "#f4f8f4",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #e2ede3"
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: "700", color: "#14371f", fontSize: "15px" }}>
            {order.productName}
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#536b56" }}>
            👨‍🌾 {order.farmerName} &nbsp;|&nbsp; {t("orderId")} #{order.id}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "14px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#1b2e1e" }}>
              {t("rating") || "Rating"} *
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "28px",
                    cursor: "pointer",
                    padding: "2px",
                    color: (hoverRating || rating) >= star ? "#eab308" : "#d1d5db",
                    transition: "transform 0.15s ease",
                    transform: (hoverRating || rating) >= star ? "scale(1.15)" : "scale(1)",
                  }}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              ))}
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#2e7d32", marginLeft: "8px" }}>
                {rating}/5
              </span>
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#1b2e1e" }}>
              {t("comment") || "Comment"}
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("feedbackPlaceholder") || "Share your experience with this fresh product..."}
              maxLength={1000}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #d2ded4",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            <div style={{ fontSize: "12px", color: "#798e7b", textAlign: "right", marginTop: "4px" }}>
              {comment.length}/1000
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ padding: "10px 20px", minWidth: "90px" }}
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              disabled={submitting}
              style={{ padding: "10px 22px", minWidth: "120px" }}
            >
              {submitting ? (t("saving") || "Submitting...") : (t("submitFeedback") || "Submit Feedback")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
