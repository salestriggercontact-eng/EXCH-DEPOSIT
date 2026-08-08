import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Hash, Calendar, ShieldCheck, LogOut, Save, Loader2, ListChecks } from 'lucide-react';
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

  const [customFields, setCustomFields] = useState([]);
  const [customValues, setCustomValues] = useState(user?.customFields || {});
  const [customLoading, setCustomLoading] = useState(true);
  const [customSaving, setCustomSaving] = useState(false);

  useEffect(() => {
    api
      .get('/custom-fields')
      .then((res) => setCustomFields(res.data.fields))
      .catch(() => {})
      .finally(() => setCustomLoading(false));
  }, []);

  useEffect(() => {
    setCustomValues(user?.customFields || {});
  }, [user]);

  const saveCustomFields = async () => {
    setCustomSaving(true);
    try {
      await api.put('/custom-fields/my', { values: customValues });
      await refreshUser();
      showToast('Details saved');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save details', 'error');
    } finally {
      setCustomSaving(false);
    }
  };

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

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

      {!customLoading && customFields.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks size={16} className="text-gray-500" />
            <h3 className="font-medium text-gray-800">Additional details</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {customFields.map((f) => (
              <CustomFieldInput
                key={f._id}
                field={f}
                value={customValues[f.fieldKey]}
                onChange={(v) => setCustomValues((prev) => ({ ...prev, [f.fieldKey]: v }))}
              />
            ))}
          </div>
          <button
            onClick={saveCustomFields}
            disabled={customSaving}
            className="mt-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60"
          >
            {customSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save details
          </button>
        </div>
      )}

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

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-600 text-sm font-medium hover:underline"
      >
        <LogOut size={16} /> Logout
      </button>
    </div>
  );
}

function CustomFieldInput({ field, value, onChange }) {
  const commonClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className={field.fieldType === 'textarea' ? 'sm:col-span-2' : ''}>
      <label className="text-xs text-gray-500 mb-1 block">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      {field.fieldType === 'textarea' ? (
        <textarea rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} className={commonClass} />
      ) : field.fieldType === 'select' ? (
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} className={commonClass}>
          <option value="">Select...</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.fieldType === 'checkbox' ? (
        <label className="flex items-center gap-2 text-sm text-gray-700 py-2">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          Yes
        </label>
      ) : (
        <input
          type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={commonClass}
        />
      )}
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
