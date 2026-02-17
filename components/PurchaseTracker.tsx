import React, { useState, useMemo, useRef } from 'react';
import { GroceryItem, GroceryCategory, FoodType } from '../types';
import { Icon } from './Icon';
import { parseReceiptImage } from '../services/gemini';

interface PurchaseTrackerProps {
  items: GroceryItem[];
  onSaveItems: (items: GroceryItem[]) => Promise<void>;
  onDeleteItem: (id: string) => void;
}

const CATEGORIES: GroceryCategory[] = ['Food', 'Household', 'Toys', 'Personal Care', 'Electronics', 'Other'];
const FOOD_TYPES: FoodType[] = ['Fresh', 'Processed', 'Ultraprocessed'];

const FOOD_COLORS: Record<FoodType, string> = {
  Fresh: '#22c55e',
  Processed: '#f59e0b',
  Ultraprocessed: '#ef4444',
};

const CAT_COLORS: Record<GroceryCategory, string> = {
  Food: '#f97316',
  Household: '#3b82f6',
  Toys: '#a855f7',
  'Personal Care': '#ec4899',
  Electronics: '#06b6d4',
  Other: '#6b7280',
};

const today = () => new Date().toISOString().split('T')[0];

// SVG Donut Chart
const DonutChart: React.FC<{ segments: { label: string; value: number; color: string }[] }> = ({ segments }) => {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const r = 52;
  const cx = 70, cy = 70;
  const C = 2 * Math.PI * r;
  let startAngle = -90;

  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36">
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={20} />
      ) : (
        segments.filter(s => s.value > 0).map((seg, i) => {
          const fraction = seg.value / total;
          const angle = startAngle;
          startAngle += fraction * 360;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color}
              strokeWidth={20} strokeDasharray={`${fraction * C} ${C}`}
              transform={`rotate(${angle} ${cx} ${cy})`} />
          );
        })
      )}
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" fill="#1f2937" fontSize="18" fontWeight="900">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" fill="#9ca3af" fontSize="9">items</text>
    </svg>
  );
};

// Horizontal bar
const Bar: React.FC<{ label: string; value: number; max: number; color: string; suffix?: string }> = ({ label, value, max, color, suffix = '' }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs font-bold text-gray-500 w-24 shrink-0 truncate">{label}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: max ? `${(value / max) * 100}%` : '0%', backgroundColor: color }} />
    </div>
    <span className="text-xs font-black text-gray-700 w-16 text-right shrink-0">{suffix}{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}</span>
  </div>
);

type Tab = 'add' | 'scan' | 'reports';

interface PendingItem {
  tempId: string;
  name: string;
  category: GroceryCategory;
  foodType: FoodType;
  price: string;
  quantity: string;
}

const PurchaseTracker: React.FC<PurchaseTrackerProps> = ({ items, onSaveItems, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState<Tab>('add');

  // Add Items tab state
  const [store, setStore] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemCat, setItemCat] = useState<GroceryCategory>('Food');
  const [itemFoodType, setItemFoodType] = useState<FoodType>('Fresh');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  // Scan tab state
  const fileRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scannedItems, setScannedItems] = useState<PendingItem[]>([]);
  const [scanStore, setScanStore] = useState('');
  const [scanDate, setScanDate] = useState(today());
  const [isSavingScan, setIsSavingScan] = useState(false);

  // Reports tab state
  const [period, setPeriod] = useState<'week' | 'month' | '3months' | 'all'>('month');

  // ---- Add Items ----
  const addPending = () => {
    if (!itemName.trim()) return;
    setPendingItems(prev => [...prev, {
      tempId: Date.now().toString() + Math.random(),
      name: itemName.trim(),
      category: itemCat,
      foodType: itemFoodType,
      price: itemPrice,
      quantity: itemQty,
    }]);
    setItemName('');
    setItemPrice('');
    setItemQty('1');
  };

  const removePending = (tempId: string) => setPendingItems(prev => prev.filter(p => p.tempId !== tempId));

  const savePurchase = async () => {
    if (pendingItems.length === 0) return;
    setIsSaving(true);
    const newItems: GroceryItem[] = pendingItems.map(p => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: p.name,
      category: p.category,
      foodType: p.category === 'Food' ? p.foodType : undefined,
      price: p.price ? parseFloat(p.price) : undefined,
      quantity: parseInt(p.quantity) || 1,
      store: store.trim() || undefined,
      purchasedAt: purchaseDate,
      createdAt: new Date().toISOString(),
    }));
    await onSaveItems(newItems);
    setPendingItems([]);
    setIsSaving(false);
  };

  // ---- Scan Receipt ----
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setScanError('');
    setScannedItems([]);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // strip data:...;base64,
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const extracted = await parseReceiptImage(base64, file.type || 'image/jpeg');
      if (extracted.length === 0) {
        setScanError('Could not extract items. Try a clearer photo or add items manually.');
      } else {
        setScannedItems(extracted.map((e, i) => ({
          tempId: i + Date.now().toString(),
          name: e.name || '',
          category: (CATEGORIES.includes(e.category as GroceryCategory) ? e.category : 'Other') as GroceryCategory,
          foodType: (FOOD_TYPES.includes(e.foodType as FoodType) ? e.foodType : 'Processed') as FoodType,
          price: e.price != null ? String(e.price) : '',
          quantity: e.quantity != null ? String(e.quantity) : '1',
        })));
      }
    } catch {
      setScanError('Scan failed. Check your Gemini API key or try again.');
    } finally {
      setIsScanning(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const updateScanned = (tempId: string, field: keyof PendingItem, value: string) => {
    setScannedItems(prev => prev.map(s => s.tempId === tempId ? { ...s, [field]: value } : s));
  };

  const saveScan = async () => {
    if (scannedItems.length === 0) return;
    setIsSavingScan(true);
    const newItems: GroceryItem[] = scannedItems.map(s => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: s.name,
      category: s.category,
      foodType: s.category === 'Food' ? s.foodType : undefined,
      price: s.price ? parseFloat(s.price) : undefined,
      quantity: parseInt(s.quantity) || 1,
      store: scanStore.trim() || undefined,
      purchasedAt: scanDate,
      createdAt: new Date().toISOString(),
    }));
    await onSaveItems(newItems);
    setScannedItems([]);
    setScanStore('');
    setScanDate(today());
    setIsSavingScan(false);
  };

  // ---- Reports ----
  const filteredItems = useMemo(() => {
    const now = new Date();
    return items.filter(item => {
      const d = new Date(item.purchasedAt);
      if (period === 'week') { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
      if (period === 'month') { const m = new Date(now); m.setMonth(m.getMonth() - 1); return d >= m; }
      if (period === '3months') { const m = new Date(now); m.setMonth(m.getMonth() - 3); return d >= m; }
      return true;
    });
  }, [items, period]);

  const reportStats = useMemo(() => {
    const totalItems = filteredItems.reduce((s, i) => s + i.quantity, 0);
    const totalSpend = filteredItems.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0);
    const stores = new Set(filteredItems.map(i => i.store).filter(Boolean)).size;

    // Food health
    const foodItems = filteredItems.filter(i => i.category === 'Food');
    const foodHealth = {
      Fresh: foodItems.filter(i => i.foodType === 'Fresh').reduce((s, i) => s + i.quantity, 0),
      Processed: foodItems.filter(i => i.foodType === 'Processed').reduce((s, i) => s + i.quantity, 0),
      Ultraprocessed: foodItems.filter(i => i.foodType === 'Ultraprocessed').reduce((s, i) => s + i.quantity, 0),
    };
    const totalFood = foodHealth.Fresh + foodHealth.Processed + foodHealth.Ultraprocessed;
    const healthScore = totalFood > 0 ? Math.round((foodHealth.Fresh / totalFood) * 100) : null;

    // Category spend
    const catSpend: Record<string, { spend: number; count: number }> = {};
    filteredItems.forEach(i => {
      if (!catSpend[i.category]) catSpend[i.category] = { spend: 0, count: 0 };
      catSpend[i.category].spend += (i.price ?? 0) * i.quantity;
      catSpend[i.category].count += i.quantity;
    });

    // Weekly trend (last 8 weeks)
    const weeks: { label: string; count: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date(); start.setDate(start.getDate() - w * 7 - 6);
      const end = new Date(); end.setDate(end.getDate() - w * 7);
      start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
      const count = filteredItems.filter(i => { const d = new Date(i.purchasedAt); return d >= start && d <= end; }).reduce((s, i) => s + i.quantity, 0);
      weeks.push({ label: `W${8 - w}`, count });
    }

    // Store breakdown
    const storeMap: Record<string, number> = {};
    filteredItems.forEach(i => { if (i.store) storeMap[i.store] = (storeMap[i.store] || 0) + i.quantity; });
    const topStores = Object.entries(storeMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { totalItems, totalSpend, stores, foodHealth, totalFood, healthScore, catSpend, weeks, topStores };
  }, [filteredItems]);

  const maxWeek = Math.max(...reportStats.weeks.map(w => w.count), 1);
  const maxCat = Math.max(...Object.values(reportStats.catSpend).map(c => c.spend), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Purchase Tracker</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Track shopping & monitor food health</p>
        </div>
        {/* Tab pills */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
          {([['add', 'cart', 'Add Items'], ['scan', 'sparkles', 'Scan Receipt'], ['reports', 'target', 'Reports']] as [Tab, any, string][]).map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === tab ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <Icon name={icon} className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================== ADD ITEMS TAB ==================== */}
      {activeTab === 'add' && (
        <div className="space-y-4">
          {/* Store + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" value={store} onChange={e => setStore(e.target.value)}
              placeholder="Store name (optional)"
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400" />
            <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400" />
          </div>

          {/* Item form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Item</p>
            <div className="flex flex-wrap gap-2">
              <input type="text" value={itemName} onChange={e => setItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPending()}
                placeholder="Item name"
                className="flex-1 min-w-[140px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400" />
              <select value={itemCat} onChange={e => setItemCat(e.target.value as GroceryCategory)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {itemCat === 'Food' && (
                <select value={itemFoodType} onChange={e => setItemFoodType(e.target.value as FoodType)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400">
                  {FOOD_TYPES.map(f => <option key={f}>{f}</option>)}
                </select>
              )}
              <input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)}
                min="1" placeholder="Qty"
                className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400" />
              <input type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)}
                min="0" step="0.01" placeholder="Price"
                className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400" />
              <button type="button" onClick={addPending} disabled={!itemName.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-30 transition-all">
                + Add
              </button>
            </div>
          </div>

          {/* Pending cart */}
          {pendingItems.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cart ({pendingItems.length} items)</p>
                <button onClick={savePurchase} disabled={isSaving}
                  className="px-4 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 disabled:opacity-50 transition-all">
                  {isSaving ? 'Saving...' : 'Save Purchase'}
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {pendingItems.map(p => (
                  <div key={p.tempId} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex-1 text-sm font-bold text-gray-800">{p.name}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: CAT_COLORS[p.category] + '20', color: CAT_COLORS[p.category] }}>{p.category}</span>
                    {p.category === 'Food' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: FOOD_COLORS[p.foodType] + '20', color: FOOD_COLORS[p.foodType] }}>{p.foodType}</span>
                    )}
                    <span className="text-xs text-gray-400 font-bold">×{p.quantity}</span>
                    {p.price && <span className="text-xs font-bold text-gray-600">£{parseFloat(p.price).toFixed(2)}</span>}
                    <button onClick={() => removePending(p.tempId)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingItems.length === 0 && items.length === 0 && (
            <div className="text-center py-16 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-300 text-xs font-bold uppercase tracking-widest">Add items above to start tracking</p>
            </div>
          )}

          {/* Recent items list */}
          {items.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recent Purchases ({items.length})</p>
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto no-scrollbar">
                {items.slice(0, 50).map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2 group">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-gray-800">{item.name}</span>
                      {item.store && <span className="text-[10px] text-gray-400 ml-2">{item.store}</span>}
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[item.category] + '20', color: CAT_COLORS[item.category] }}>{item.category}</span>
                    {item.category === 'Food' && item.foodType && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: FOOD_COLORS[item.foodType] + '20', color: FOOD_COLORS[item.foodType] }}>{item.foodType}</span>
                    )}
                    <span className="text-xs text-gray-400">×{item.quantity}</span>
                    {item.price != null && <span className="text-xs font-bold text-gray-600">£{(item.price * item.quantity).toFixed(2)}</span>}
                    <button onClick={() => onDeleteItem(item.id)} className="p-1 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== SCAN RECEIPT TAB ==================== */}
      {activeTab === 'scan' && (
        <div className="space-y-4">
          {/* Upload zone */}
          <div
            className="border-2 border-dashed border-orange-200 rounded-3xl p-10 text-center bg-orange-50/30 cursor-pointer hover:bg-orange-50 transition-all"
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {isScanning ? (
              <div className="space-y-3">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-black text-orange-600">Scanning receipt with AI...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Icon name="sparkles" className="w-7 h-7 text-orange-500" />
                </div>
                <p className="text-sm font-black text-gray-700">Tap to upload receipt photo</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AI will extract & classify all items</p>
              </div>
            )}
          </div>

          {scanError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-xs font-bold text-red-700">{scanError}</div>
          )}

          {/* Scanned items review */}
          {scannedItems.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-emerald-50 flex justify-between items-center">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">✓ {scannedItems.length} items extracted — review & edit below</p>
              </div>

              <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-gray-100">
                <input type="text" value={scanStore} onChange={e => setScanStore(e.target.value)}
                  placeholder="Store name (optional)"
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400" />
                <input type="date" value={scanDate} onChange={e => setScanDate(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400" />
              </div>

              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto no-scrollbar">
                {scannedItems.map(s => (
                  <div key={s.tempId} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                    <input type="text" value={s.name} onChange={e => updateScanned(s.tempId, 'name', e.target.value)}
                      className="flex-1 min-w-[100px] text-sm font-bold text-gray-800 bg-transparent border-b border-gray-200 outline-none focus:border-orange-400 py-0.5" />
                    <select value={s.category} onChange={e => updateScanned(s.tempId, 'category', e.target.value)}
                      className="text-[10px] font-black border border-gray-200 rounded-lg px-2 py-1 outline-none">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {s.category === 'Food' && (
                      <select value={s.foodType} onChange={e => updateScanned(s.tempId, 'foodType', e.target.value)}
                        className="text-[10px] font-black border border-gray-200 rounded-lg px-2 py-1 outline-none">
                        {FOOD_TYPES.map(f => <option key={f}>{f}</option>)}
                      </select>
                    )}
                    <input type="number" value={s.quantity} onChange={e => updateScanned(s.tempId, 'quantity', e.target.value)}
                      min="1" className="w-12 text-xs font-bold text-center border border-gray-200 rounded-lg px-1 py-1 outline-none" />
                    {s.price && <span className="text-xs text-gray-500 font-bold">£{parseFloat(s.price).toFixed(2)}</span>}
                    <button onClick={() => setScannedItems(prev => prev.filter(p => p.tempId !== s.tempId))}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <button onClick={saveScan} disabled={isSavingScan}
                  className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-all">
                  {isSavingScan ? 'Saving...' : `Save ${scannedItems.length} Items`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== REPORTS TAB ==================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
            {([['week', 'Week'], ['month', 'Month'], ['3months', '3 Months'], ['all', 'All']] as [typeof period, string][]).map(([p, label]) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${period === p ? 'bg-white shadow text-orange-600' : 'text-gray-400'}`}>
                {label}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-300 text-xs font-bold uppercase tracking-widest">No data for this period</p>
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Items', value: reportStats.totalItems, suffix: '' },
                  { label: 'Total Spend', value: `£${reportStats.totalSpend.toFixed(2)}`, suffix: '' },
                  { label: 'Stores', value: reportStats.stores, suffix: '' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
                    <p className="text-2xl font-black text-gray-900">{s.value}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Food Health */}
              {reportStats.totalFood > 0 && (
                <div className="bg-white border border-gray-200 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🥗</span>
                    <h3 className="text-sm font-black text-gray-800">Food Health Breakdown</h3>
                    {reportStats.healthScore !== null && (
                      <span className={`ml-auto text-xs font-black px-3 py-1 rounded-full ${reportStats.healthScore >= 60 ? 'bg-green-100 text-green-700' : reportStats.healthScore >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {reportStats.healthScore}% Fresh
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <DonutChart segments={FOOD_TYPES.map(f => ({ label: f, value: reportStats.foodHealth[f], color: FOOD_COLORS[f] }))} />
                    <div className="flex-1 space-y-3 w-full">
                      {FOOD_TYPES.map(f => (
                        <div key={f} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: FOOD_COLORS[f] }} />
                          <span className="text-xs font-bold text-gray-700 flex-1">{f}</span>
                          <span className="text-xs font-black text-gray-900">{reportStats.foodHealth[f]} items</span>
                          <span className="text-[10px] text-gray-400 font-bold w-10 text-right">
                            {reportStats.totalFood > 0 ? Math.round((reportStats.foodHealth[f] / reportStats.totalFood) * 100) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Category Spend */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🛒</span>
                  <h3 className="text-sm font-black text-gray-800">Spend by Category</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(reportStats.catSpend).sort((a, b) => b[1].spend - a[1].spend).map(([cat, data]) => (
                    <Bar key={cat} label={cat} value={data.spend} max={maxCat}
                      color={CAT_COLORS[cat as GroceryCategory] || '#6b7280'} suffix="£" />
                  ))}
                </div>
              </div>

              {/* Weekly Trend */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📈</span>
                  <h3 className="text-sm font-black text-gray-800">Weekly Trend (items)</h3>
                </div>
                <div className="flex items-end gap-1.5 h-24">
                  {reportStats.weeks.map((w, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[8px] font-bold text-gray-400">{w.count > 0 ? w.count : ''}</span>
                      <div className="w-full bg-orange-500 rounded-t-md transition-all duration-500"
                        style={{ height: `${maxWeek > 0 ? (w.count / maxWeek) * 72 : 2}px`, minHeight: '2px', opacity: w.count > 0 ? 1 : 0.15 }} />
                      <span className="text-[8px] font-black text-gray-300">{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Store Breakdown */}
              {reportStats.topStores.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🏪</span>
                    <h3 className="text-sm font-black text-gray-800">Top Stores</h3>
                  </div>
                  <div className="space-y-3">
                    {reportStats.topStores.map(([name, count]) => (
                      <Bar key={name} label={name} value={count}
                        max={reportStats.topStores[0][1]} color="#f97316" />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PurchaseTracker;
