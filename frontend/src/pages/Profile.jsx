import { useState } from 'react';
import { useAuth } from '../components/context/AuthContext';
import { useLanguage } from '../components/context/LanguageContext';
import { useNotification } from '../components/context/NotificationContext';
import { profileAPI } from '../components/services/api';
import './dashboard.css';

const Profile = () => {
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const { showModal } = useNotification();

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    address: user?.address || '',
  });
  const [pwData, setPwData] = useState({ pin: '', newPassword: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    setProfileErr('');
    try {
      const updated = await profileAPI.update(user.id, profileData);
      login({ ...user, fullName: updated.fullName, email: updated.email, address: updated.address });
      setProfileMsg(t('profileUpdated'));
      showModal({
        type: 'success',
        title: t('profileUpdated') || 'Profile Updated',
        message: 'Your personal and contact information has been successfully saved.',
        autoCloseMs: 1500,
      });
    } catch (err) {
      setProfileErr(err.message || t('profileUpdateFailed'));
      showModal({
        type: 'error',
        title: t('profileUpdateFailed') || 'Update Failed',
        message: err.message || 'Could not update profile information.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwData.pin || !pwData.newPassword) return;
    if (pwData.newPassword.length < 6) { setPwErr(t('passwordMinLength')); return; }
    setSavingPw(true);
    setPwMsg('');
    setPwErr('');
    try {
      await profileAPI.changePassword(user.mobileNumber, pwData.pin, pwData.newPassword);
      setPwMsg(t('passwordChanged'));
      setPwData({ pin: '', newPassword: '' });
      showModal({
        type: 'success',
        title: t('passwordChanged') || 'Password Changed',
        message: 'Your password has been successfully updated.',
        autoCloseMs: 1500,
      });
    } catch (err) {
      setPwErr(err.message || t('passwordChangeFailed'));
      showModal({
        type: 'error',
        title: t('passwordChangeFailed') || 'Error',
        message: err.message || 'Failed to update password.',
      });
    } finally {
      setSavingPw(false);
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>👤 {t('profileTitle')}</h1>
          <span className="user-info">{user.fullName} — <strong style={{ color: '#2e7d32' }}>{user.role}</strong></span>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Edit Profile */}
        <div className="content-section" style={{ marginBottom: '24px' }}>
          <h2>{t('editProfile')}</h2>
          {profileMsg && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>
              ✓ {profileMsg}
            </div>
          )}
          {profileErr && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>
              ⚠️ {profileErr}
            </div>
          )}
          <form onSubmit={handleProfileSave} style={{ maxWidth: '520px' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '7px', fontWeight: 600, color: '#384f3c' }}>{t('name')}</label>
              <input
                type="text"
                value={profileData.fullName}
                onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #d2ded4', fontSize: '14.5px', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '7px', fontWeight: 600, color: '#384f3c' }}>{t('email')}</label>
              <input
                type="email"
                value={profileData.email}
                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #d2ded4', fontSize: '14.5px', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '7px', fontWeight: 600, color: '#384f3c' }}>{t('address')}</label>
              <input
                type="text"
                placeholder={t('addressPlaceholder')}
                value={profileData.address}
                onChange={e => setProfileData({ ...profileData, address: e.target.value })}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #d2ded4', fontSize: '14.5px', boxSizing: 'border-box' }}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={savingProfile} style={{ padding: '12px 24px' }}>
              {savingProfile ? t('saving') : t('updateProfile')}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="content-section">
          <h2>{t('changePassword')}</h2>
          {pwMsg && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>
              ✓ {pwMsg}
            </div>
          )}
          {pwErr && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>
              ⚠️ {pwErr}
            </div>
          )}
          <form onSubmit={handlePasswordChange} style={{ maxWidth: '520px' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '7px', fontWeight: 600, color: '#384f3c' }}>{t('currentPin')}</label>
              <input
                type="password"
                maxLength={4}
                placeholder="****"
                value={pwData.pin}
                onChange={e => setPwData({ ...pwData, pin: e.target.value })}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #d2ded4', fontSize: '14.5px', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '7px', fontWeight: 600, color: '#384f3c' }}>{t('newPassword')}</label>
              <input
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={pwData.newPassword}
                onChange={e => setPwData({ ...pwData, newPassword: e.target.value })}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #d2ded4', fontSize: '14.5px', boxSizing: 'border-box' }}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={savingPw} style={{ padding: '12px 24px' }}>
              {savingPw ? t('saving') : t('changePassword')}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;

