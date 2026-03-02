import React, { useState, useMemo } from 'react';
import { ImmediateBuyItem, Priority } from '../types';
import { Icon } from './Icon';

interface ImmediateBuyListProps {
  items: ImmediateBuyItem[];
  onSave: (item: ImmediateBuyItem) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

const PRIORITIES: Priority[] = [Priority.HIGH, Priority.MEDIUM, Priority.LOW];

const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string }> = {
  [Priority.HIGH]:   { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300' },
  [Priority.MEDIUM]: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  [Priority.LOW]:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
};

const ImmediateBuyList: React.FC<ImmediateBuyListProps> = ({ items, onSave, onDelete, onToggleComplete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [store, setStore] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [cost, setCost] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const pending = useMemo(() =>
    items.filter(i => !i.completed).sort((a, b) => {
      const priorityOrder = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }),
    [items]
  );

  const completed = useMemo(() =>
    items.filter(i => i.completed).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [items]
  );

  const stats = useMemo(() => {
    const totalCost = pending.reduce((sum, i) => sum + (i.cost || 0), 0);
    return {
      total: pending.length,
      high: pending.filter(i => i.priority === Priority.HIGH).length,
      medium: pending.filter(i => i.priority === Priority.MEDIUM).length,
      low: pending.filter(i => i.priority === Priority.LOW).length,
      totalCost,
    };
  }, [pending]);

  const resetForm = () => {
    setItem(''); setQuantity(''); setStore(''); setPriority(Priority.MEDIUM); setCost('');
    setEditingId(null); setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) return;
    const buyItem: ImmediateBuyItem = {
      id: editingId || Date.now().toString(),
      item: item.trim(),
      quantity: quantity ? parseInt(quantity) : undefined,
      store: store.trim() || undefined,
      priority,
      completed: false,
      cost: cost ? parseFloat(cost) : undefined,
      createdAt: editingId
        ? (items.find(i => i.id === editingId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
    };
    onSave(buyItem);
    resetForm();
  };

  const startEdit = (buyItem: ImmediateBuyItem) => {
    setItem(buyItem.item); setQuantity(buyItem.quantity?.toString() || '');
    setStore(buyItem.store || ''); setPriority(buyItem.priority);
    setCost(buyItem.cost?.toString() || '');
    setEditingId(buyItem.id); setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Immediate Buy List</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Essential items to purchase ASAP</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm self-start sm:self-auto"
        >
          <Icon name="plus" className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-gray-700">{stats.total}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">To Buy</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-red-600">{stats.high}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">High</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-orange-600">{stats.medium}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Medium</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-600">{stats.low}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Low</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-black text-blue-600">${stats.totalCost.toFixed(2)}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Total Cost</p>
          </div>
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white border-2 border-orange-100 rounded-3xl p-6 shadow-lg shadow-orange-50">
          <h3 className="text-base font-black text-gray-800 mb-4">{editingId ? 'Edit Item' : 'Add Item to Buy'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Priority selector */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      priority === p
                        ? `${PRIORITY_COLORS[p].bg} ${PRIORITY_COLORS[p].text} ${PRIORITY_COLORS[p].border} shadow-sm`
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Item</label>
                <input
                  type="text" value={item} onChange={e => setItem(e.target.value)}
                  placeholder="e.g., Milk, Bread, Light bulbs"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                  required autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Quantity (optional)</label>
                <input
                  type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)}
                  placeholder="1"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Store (optional)</label>
                <input
                  type="text" value={store} onChange={e => setStore(e.target.value)}
                  placeholder="e.g., Tesco, Amazon"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Estimated Cost (optional)</label>
                <input
                  type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={resetForm}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 shadow-md">
                {editingId ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No items to buy</p>
          <p className="text-gray-300 text-xs mt-1">Add items you need to purchase immediately</p>
        </div>
      )}

      {/* Pending Items */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">To Buy ({pending.length})</h2>
          {pending.map(buyItem => {
            const col = PRIORITY_COLORS[buyItem.priority];
            return (
              <div key={buyItem.id} className={`bg-white rounded-xl border-2 ${col.border} p-4 group transition-all hover:shadow-md`}>
                <div className="flex items-start gap-3">
                  {/* Complete checkbox */}
                  <button
                    onClick={() => onToggleComplete(buyItem.id)}
                    className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-emerald-400 flex items-center justify-center shrink-0 transition-all"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-800">{buyItem.item}</p>
                          {buyItem.quantity && (
                            <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                              ×{buyItem.quantity}
                            </span>
                          )}
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${col.bg} ${col.text} uppercase tracking-wider`}>
                            {buyItem.priority}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {buyItem.store && (
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                              <Icon name="shopping-cart" className="w-3 h-3" />
                              {buyItem.store}
                            </span>
                          )}
                          {buyItem.cost !== undefined && (
                            <span className="text-[10px] font-bold text-orange-600">
                              ${buyItem.cost.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => startEdit(buyItem)} className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
                          <Icon name="edit" className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(buyItem.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                          <Icon name="trash" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Items */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest px-2 hover:text-gray-600 transition-colors"
          >
            <Icon name={showCompleted ? 'eye-off' : 'eye'} className="w-4 h-4" />
            Completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="space-y-2">
              {completed.map(buyItem => (
                <div key={buyItem.id} className="bg-white border border-gray-200 rounded-xl p-4 opacity-60 group hover:opacity-100 transition-all">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleComplete(buyItem.id)}
                      className="w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0"
                    >
                      <Icon name="check" className="w-3 h-3 text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-400 line-through">{buyItem.item}</p>
                      {buyItem.quantity && (
                        <span className="text-[10px] font-black text-gray-300">×{buyItem.quantity}</span>
                      )}
                    </div>
                    <button onClick={() => onDelete(buyItem.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImmediateBuyList;
