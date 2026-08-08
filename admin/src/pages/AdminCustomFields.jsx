import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { adminApi } from '../api/axios';
import { useToast } from '../context/ToastContext';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Long text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox (yes/no)' },
];

const emptyForm = { label: '', fieldType: 'text', options: '', required: false, order: 0, isActive: true };

export default function AdminCustomFields() {
  const { showToast } = useToast();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi
      .get('/custom-fields/admin/all')
      .then((res) => setFields(res.data.fields))
      .catch(() => showToast('Failed to load fields', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (f) => {
    setEditingId(f._id);
    setForm({
      label: f.label,
      fieldType: f.fieldType,
      options: (f.options || []).join(', '),
      required: f.required,
      order: f.order,
      isActive: f.isActive,
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) {
      showToast('Field label is required', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      label: form.label.trim(),
      fieldType: form.fieldType,
      options: form.fieldType === 'select' ? form.options.split(',').map((o) => o.trim()).filter(Boolean) : [],
      required: form.required,
      order: Number(form.order) || 0,
      isActive: form.isActive,
    };
    try {
      if (editingId) {
        await adminApi.patch(`/custom-fields/admin/${editingId}`, payload);
        showToast('Field updated');
      } else {
        await adminApi.post('/custom-fields/admin', payload);
        showToast('Field added — now visible on user Account page');
      }
      resetForm();
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save field', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this field? Users will no longer see or answer it.')) return;
    try {
      await adminApi.delete(`/custom-fields/admin/${id}`);
      showToast('Field removed');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove field', 'error');
    }
  };

  const toggleActive = async (f) => {
    try {
      await adminApi.patch(`/custom-fields/admin/${f._id}`, { isActive: !f.isActive });
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update field', 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Account page custom fields</h2>
        <p className="text-sm text-gray-500">Add questions/fields that appear on every user's Account page.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-medium text-gray-800 mb-4">{editingId ? 'Edit field' : 'Add new field'}</h3>
        <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
          <input
            required
            placeholder="Field label (e.g. PAN Number)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <select
            value={form.fieldType}
            onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Display order (0 = first)"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {form.fieldType === 'select' && (
            <input
              placeholder="Options, comma separated (e.g. Yes, No, Maybe)"
              value={form.options}
              onChange={(e) => setForm({ ...form, options: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
            />
          )}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.required} onChange={(e) => setForm({ ...form, required: e.target.checked })} />
            Required
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active (visible to users)
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {editingId ? <Check size={14} /> : <Plus size={14} />}
              {saving ? 'Saving...' : editingId ? 'Update field' : 'Add field'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <X size={14} /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
        ) : fields.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No custom fields yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium">Order</th>
                <th className="py-2 font-medium">Label</th>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Required</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f._id} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-500">{f.order}</td>
                  <td className="py-2.5 text-gray-800 font-medium">{f.label}</td>
                  <td className="py-2.5 text-gray-600 capitalize">{f.fieldType}</td>
                  <td className="py-2.5 text-gray-600">{f.required ? 'Yes' : 'No'}</td>
                  <td className="py-2.5">
                    <button
                      onClick={() => toggleActive(f)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        f.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {f.isActive ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(f)} className="text-gray-600 hover:bg-gray-50 rounded p-1.5">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(f._id)} className="text-red-600 hover:bg-red-50 rounded p-1.5">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
