import React, { useState } from 'react';
import { VaultItem } from '../types';
import { Icon } from './Icon';

interface VaultViewProps {
  items: VaultItem[];
  onAdd: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onUpdate: (item: VaultItem) => void;
  syncError?: string;
}

const VAULT_CATEGORIES = [
  { id: 'Identity', icon: '🪪', color: 'blue' },
  { id: 'Insurance', icon: '🛡️', color: 'emerald' },
  { id: 'Finance', icon: '💳', color: 'purple' },
  { id: 'Vehicle', icon: '🚗', color: 'orange' },
  { id: 'Health', icon: '🏥', color: 'red' },
  { id: 'Property', icon: '🏠', color: 'yellow' },
  { id: 'Other', icon: '📋', color: 'gray' },
];

const categoryColor: Record<string, string> = {
  Identity: 'bg-blue-50 border-blue-200 text-blue-700',
  Insurance: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Finance: 'bg-purple-50 border-purple-200 text-purple-700',
  Vehicle: 'bg-orange-50 border-orange-200 text-orange-700',
  Health: 'bg-red-50 border-red-200 text-red-700',
  Property: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  Other: 'bg-gray-50 border-gray-200 text-gray-700',
};

const VaultView: React.FC<VaultViewProps> = ({ items, onAdd, onDelete, onUpdate, syncError }) => {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('Identity');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const resetForm = () => {
    setLabel('');
    setValue('');
    setCategory('Identity');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !value.trim()) return;

    if (editingId) {
      const existing = items.find(i => i.id === editingId)!;
      onUpdate({ ...existing, label: label.trim(), value: value.trim(), category });
    } else {
      onAdd({
        id: Date.now().toString(),
        label: label.trim(),
        value: value.trim(),
        category,
        createdAt: new Date().toISOString(),
      });
    }
    resetForm();
  };

  const startEdit = (item: VaultItem) => {
    setLabel(item.label);
    setValue(item.value);
    setCategory(item.category);
    setEditingId(item.id);
    setShowForm(true);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const grouped = VAULT_CATEGORIES.reduce<Record<string, VaultItem[]>>((acc, cat) => {
    acc[cat.id] = items.filter(i => i.category === cat.id);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Information Vault</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">
            Securely store document numbers, policy IDs & more
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm"
        >
          <Icon name="plus" className="w-4 h-4" />
          <span>Add Info</span>
        </button>
      </div>

      {/* Sync error banner */}
      {syncError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-xs font-bold text-red-700">
          {syncError}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white border-2 border-orange-100 rounded-3xl p-6 shadow-lg shadow-orange-50">
          <h3 className="text-base font-black text-gray-800 mb-4">
            {editingId ? 'Edit Entry' : 'Add New Entry'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {VAULT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      category === cat.id
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {cat.icon} {cat.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Label</label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Passport Number"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Value</label>
                <input
                  type="text"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder="e.g. A12345678"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={resetForm} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 shadow-md">
                {editingId ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && !showForm && (
        <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
          <div className="text-5xl mb-4">🔐</div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No entries yet</p>
          <p className="text-gray-300 text-xs mt-1">Add passport numbers, policy IDs, account numbers and more</p>
        </div>
      )}

      {/* Grouped Items */}
      {VAULT_CATEGORIES.filter(cat => grouped[cat.id].length > 0).map(cat => (
        <div key={cat.id}>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-3">
            {cat.icon} {cat.id}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grouped[cat.id].map(item => {
              const isRevealed = revealedIds.has(item.id);
              const masked = '•'.repeat(Math.min(item.value.length, 12));
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border-2 ${categoryColor[item.category] || categoryColor['Other']} group transition-all hover:shadow-md`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{item.label}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(item)} className="p-1 hover:opacity-70">
                        <Icon name="edit" className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDelete(item.id)} className="p-1 hover:opacity-70">
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-black tracking-wider truncate">
                      {isRevealed ? item.value : masked}
                    </p>
                    <button
                      onClick={() => toggleReveal(item.id)}
                      className="text-[9px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 shrink-0 border border-current rounded-md px-2 py-0.5"
                    >
                      {isRevealed ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VaultView;
