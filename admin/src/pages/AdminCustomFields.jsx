import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { adminApi } from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function AdminCustomFields() {
  const { showToast } = useToast();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'text',
    options: '',
    required: false,
    defaultValue: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadFields = () => {
    setLoading(true);
    adminApi
      .get('/admin/custom-fields')
      .then((res) => setFields(res.data.fields))
      .catch(() => showToast('Failed to load custom fields', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFields();
  }, []);

  const openCreateModal = () => {
    setEditingField(null);
    setFormData({
      name: '',
      label: '',
      type: 'text',
      options: '',
      required: false,
      defaultValue: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (field) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      options: field.options ? field.options.join(', ') : '',
      required: field.required,
      defaultValue: field.defaultValue ?? '',
      isActive: field.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingField(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        label: formData.label.trim(),
        type: formData.type,
        options: formData.type === 'select' ? formData.options.split(',').map(s => s.trim()).filter(Boolean) : [],
        required: formData.required,
        defaultValue: formData.defaultValue,
        isActive: formData.isActive,
      };
      if (editingField) {
        await adminApi.put(`/admin/custom-fields/${editingField._id}`, payload);
        showToast('Custom field updated');
      } else {
        await adminApi.post('/admin/custom-fields', payload);
        showToast('Custom field created');
      }
      closeModal();
      loadFields();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteField = async (id) => {
    if (!window.confirm('Delete this custom field? This will remove the field from all users.')) return;
    try {
      await adminApi.delete(`/admin/custom-fields/${id}`);
      showToast('Field deleted');
      loadFields();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Custom User Fields</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Add Field
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
        ) : fields.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No custom fields defined.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Label</th>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Required</th>
                <th className="py-2 font-medium">Default</th>
                <th className="py-2 font-medium">Active</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f._id} className="border-b border-gray-50">
                  <td className="py-2.5 font-mono text-xs">{f.name}</td>
                  <td className="py-2.5">{f.label}</td>
                  <td className="py-2.5 capitalize">{f.type}</td>
                  <td className="py-2.5">{f.required ? 'Yes' : 'No'}</td>
                  <td className="py-2.5">{f.defaultValue ?? '-'}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${f.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {f.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2.5 flex gap-2">
                    <button onClick={() => openEditModal(f)} className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                      <Edit size={12} /> Edit
                    </button>
                    <button onClick={() => deleteField(f._id)} className="text-red-600 hover:underline text-xs flex items-center gap-1">
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Field Name (identifier)</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!!editingField}
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                  placeholder="e.g., dateOfBirth"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Used as key in database; cannot be changed after creation.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Label</label>
                <input
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Date of Birth"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Field Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                  <option value="textarea">Textarea</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                </select>
              </div>
              {formData.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Options (comma-separated)</label>
                  <input
                    name="options"
                    value={formData.options}
                    onChange={handleChange}
                    className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Option1, Option2, Option3"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Value</label>
                <input
                  name="defaultValue"
                  value={formData.defaultValue}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional default"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="required"
                  checked={formData.required}
                  onChange={handleChange}
                  className="rounded"
                />
                <label className="text-sm text-gray-700">Required field</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded"
                />
                <label className="text-sm text-gray-700">Active (visible in forms and tables)</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
