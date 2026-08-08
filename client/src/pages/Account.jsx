import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Hash, Calendar, ShieldCheck, LogOut, Save, Loader2, ListChecks, BadgeCheck, Clock } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(user?.bankDetails?.ifscCode || '');
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || '');
  const [bankSaving, setBankSaving] = useState(false);

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

  const saveBankDetails = async () => {
    if (!accountNumber || !ifscCode || !bankName) {
      showToast('Fill in all bank detail fields', 'error');
      return;
    }
    setBankSaving(true);
    try {
      await api.put('/auth/bank-details', { accountNumber, ifscCode, bankName });
      await refreshUser();
      showToast('Bank details saved, pending admin verification');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save bank details', 'error');
    } finally {
      setBankSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-semibold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{user?.name}</h2>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user?.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {user?.status === 'suspended' ? 'Suspended' : 'Active'}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field icon={User} label="Full Name" editing={editing} value={name} onChange={setName} display={user?.name} />
          <Field icon={Mail} label="Email" value={user?.email} display={user?.email} locked />
          <Field icon={Phone} label="Mobile Number" editing={editing} value={mobile} onChange={setMobile} display={user?.mobile} />
          <Field icon={Hash} label="Account ID" display={user?.accountId} locked />
          <Field
            icon={Calendar}
            label="Registration Date"
            display={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
            locked
          />
          <Field icon={ShieldCheck} label="Account Status" display={user?.isUnlocked ? 'Unlocked' : 'Locked'} locked />
        </div>

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
                  setName(user?.name || '');
                  setMobile(user?.mobile || '');
                }}
                className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Edit profile
            </button>
          )}
        </div>
      </div>

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
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {pwSaving ? 'Saving...' : 'Update password'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-800 font-medium">
            <ListChecks size={18} className="text-gray-400" />
            Additional details
          </div>
          {user?.bankDetails?.accountNumber && (
            <span
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                user.bankDetails.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {user.bankDetails.verified ? <BadgeCheck size={13} /> : <Clock size={13} />}
              {user.bankDetails.verified ? 'Verified' : 'Pending verification'}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Bank account number"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">
              IFSC Code <span className="text-red-500">*</span>
            </label>
            <input
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. SBIN0001234"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. State Bank of India"
            />
          </div>
        </div>

        <button
          onClick={saveBankDetails}
          disabled={bankSaving}
          className="mt-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60"
        >
          {bankSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save details
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-600 text-sm font-medium hover:underline"
      >
        <LogOut size={16} /> Logout
      </button>
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      ) : (
        <div className="text-sm text-gray-800 font-medium py-2">{display || '-'}</div>
      )}
    </div>
  );
}
