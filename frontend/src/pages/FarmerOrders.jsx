import { useEffect, useState } from 'react';
import { useLanguage } from '../components/context/LanguageContext';
import { useAuth } from '../components/context/AuthContext';
import { useNotification } from '../components/context/NotificationContext';
import { orderAPI } from '../components/services/api';
import './dashboard.css';

const STATUS_TRANSITIONS = {
  PENDING:   ['ACCEPTED', 'REJECTED'],
  ACCEPTED:  ['PACKED'],
  PACKED:    ['SHIPPED'],
  SHIPPED:   ['DELIVERED'],
  REJECTED:  [],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_LABELS = {
  ACCEPTED: '✅ Accept',
  REJECTED: '❌ Reject',
  PACKED:   '📦 Mark Packed',
  SHIPPED:  '🚚 Mark Shipped',
  DELIVERED:'✔️ Mark Delivered',
};

const FarmerOrders = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showModal, showToast } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const fetched = await orderAPI.getByFarmer(user.id);
      setOrders(fetched.map(o => ({
        id: o.id,
        productName: o.product?.name || '',
        buyerName: o.buyer?.fullName || o.buyer?.mobileNumber || '',
        buyerPhone: o.buyer?.mobileNumber || '',
        quantity: o.quantity,
        totalPrice: o.totalPrice,
        status: o.status || 'PENDING',
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
      })));
    } catch (err) {
      console.error('Failed to load farmer orders:', err);
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, user.id, newStatus);
      await loadOrders();
      showToast({
        type: 'success',
        message: `Order #${orderId} marked as ${newStatus}`,
      });
    } catch (err) {
      showModal({
        type: 'error',
        title: 'Order Status Error',
        message: err.message || 'Failed to update order status',
      });
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '24px auto', padding: '0 20px' }}>
      <h2 style={{ color: '#14371f', marginBottom: '20px', fontSize: '24px', fontWeight: 700 }}>
        📋 {t('ordersReceived')}
      </h2>

      {loading && <p style={{ color: '#536b56', textAlign: 'center', padding: '20px' }}>{t('loading') || 'Loading...'}</p>}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}
      
      {!loading && orders.length === 0 && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2ede3',
          borderRadius: '14px',
          padding: '48px 20px',
          textAlign: 'center',
          color: '#536b56'
        }}>
          <p style={{ fontSize: '16px', margin: 0 }}>{t('noOrdersYet')}</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        {orders.map(o => (
          <div
            key={o.id}
            style={{
              background: '#ffffff',
              border: '1px solid #e2ede3',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(20, 45, 23, 0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '17px', color: '#14371f' }}>
                  Order #{o.id} — <span style={{ color: '#2e7d32' }}>{o.productName}</span>
                </p>
                <p style={{ margin: '4px 0', color: '#536b56', fontSize: '14px' }}>
                  👤 <strong>{t('buyerPhoneLabel') || 'Buyer'}:</strong> {o.buyerName} {o.buyerPhone ? `(${o.buyerPhone})` : ''}
                </p>
                <p style={{ margin: '4px 0', color: '#536b56', fontSize: '14px' }}>
                  📦 <strong>{t('quantityLabel')}:</strong> {o.quantity} kg &nbsp;|&nbsp;
                  💰 <strong>Total:</strong> ₹{o.totalPrice} &nbsp;|&nbsp;
                  📅 <strong>{t('dateLabel') || 'Date'}:</strong> {o.date}
                </p>
              </div>

              <div>
                <span className={`status-badge status-${o.status.toLowerCase().replace(' ', '-')}`}>
                  {o.status}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #edf3ee', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(STATUS_TRANSITIONS[o.status] || []).map(nextStatus => (
                <button
                  key={nextStatus}
                  className={nextStatus === 'REJECTED' ? 'btn-small btn-danger' : 'btn-small btn-edit'}
                  onClick={() => updateStatus(o.id, nextStatus)}
                  style={{ padding: '8px 14px', fontSize: '13px' }}
                >
                  {STATUS_LABELS[nextStatus] || nextStatus}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FarmerOrders;

