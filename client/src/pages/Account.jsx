import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Hash, Calendar, ShieldCheck, LogOut, Save, Loader2 } from 'lucide-react';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Account() {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [customFields, setCustomFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (user?.customFields) {
      setCustomFields(user.customFields);
    }
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', { name, mobile });
      await refreshUser();
      showToast('Profile updated');
      setEditing(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast('Fill in both password fields', 'error');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      showToast('Password changed successfully');
      setPwOpen(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  if (!user) return <div className="text-center text-gray-400 py-20">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-semibold">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-800">{user.name}</div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {user.status === 'suspended' ? 'Suspended' : 'Active'}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field icon={User} label="Full Name" editing={editing} value={name} onChange={setName} display={user.name} />
          <Field icon={Mail} label="Email" value={user.email} display={user.email} locked />
          <Field icon={Phone} label="Mobile Number" editing={editing} value={mobile} onChange={setMobile} display={user.mobile} />
          <Field icon={Hash} label="Account ID" display={user.accountId} locked />
          <Field
            icon={Calendar}
            label="Registration Date"
            display={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
            locked
          />
          <Field icon={ShieldCheck} label="Account Status" display={user.isUnlocked ? 'Unlocked' : 'Locked'} locked />
        </div>

        {/* Custom Fields Section */}
        {Object.keys(customFields).length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Additional Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(customFields).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="text-sm text-gray-800 font-medium py-2">
                    {value !== undefined && value !== null && value !== '' ? value : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {editing ? (
            <>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(user.name || '');
                  setMobile(user.mobile || '');
                }}
                className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Edit profile
            </button>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Change password</h3>
            <p className="text-sm text-gray-500">Update your account password</p>
          </div>
          <button
            onClick={() => setPwOpen((o) => !o)}
            className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            {pwOpen ? 'Cancel' : 'Change password'}
          </button>
        </div>
        {pwOpen && (
          <div className="mt-4 space-y-3">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={savePassword}
              disabled={pwSaving}
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60"
            >
              {pwSaving ? <Loader2 size={14} className="animate-spin" /> : null}
              Update password
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 text-sm font-medium hover:underline"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, editing, display, locked }) {
  return (
    <div>
      <label className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
        <Icon size={13} /> {label}
      </label>
      {editing && !locked ? (
        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      ) : (
        <div className="text-sm text-gray-800 font-medium py-2">{display || '-'}</div>
      )}
    </div>
  );
}
