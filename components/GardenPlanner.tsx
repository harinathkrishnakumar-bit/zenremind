import React, { useState, useMemo } from 'react';
import { GardenPlant, GardenTask, PlantCategory, GardenStatus, RecurrenceType } from '../types';
import { Icon } from './Icon';

interface GardenPlannerProps {
  plants: GardenPlant[];
  tasks: GardenTask[];
  onSavePlant: (plant: GardenPlant) => void;
  onDeletePlant: (id: string) => void;
  onSaveTask: (task: GardenTask) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
}

const PLANT_CATEGORIES: PlantCategory[] = ['Vegetable', 'Herb', 'Flower', 'Fruit', 'Tree', 'Shrub', 'Other'];
const STATUSES: GardenStatus[] = ['ToBuy', 'Sowing', 'PlantOut', 'Growing', 'Harvesting', 'Complete'];

const STATUS_LABELS: Record<GardenStatus, string> = {
  ToBuy: 'To Buy',
  Sowing: 'Sowing',
  PlantOut: 'Plant Out',
  Growing: 'Growing',
  Harvesting: 'Harvesting',
  Complete: 'Complete',
};

const STATUS_COLORS: Record<GardenStatus, { bg: string; text: string; dot: string }> = {
  ToBuy:      { bg: 'bg-gray-100',    text: 'text-gray-700',    dot: '#6b7280' },
  Sowing:     { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: '#f59e0b' },
  PlantOut:   { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: '#3b82f6' },
  Growing:    { bg: 'bg-green-100',   text: 'text-green-700',   dot: '#22c55e' },
  Harvesting: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: '#10b981' },
  Complete:   { bg: 'bg-purple-100',  text: 'text-purple-700',  dot: '#a855f7' },
};

const todayStr = () => new Date().toISOString().split('T')[0];

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const GardenPlanner: React.FC<GardenPlannerProps> = ({
  plants, tasks, onSavePlant, onDeletePlant, onSaveTask, onDeleteTask, onToggleTask
}) => {
  const [activeTab, setActiveTab] = useState<'plants' | 'tasks' | 'calendar'>('plants');

  // Plant form state
  const [showPlantForm, setShowPlantForm] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [plantName, setPlantName] = useState('');
  const [plantVariety, setPlantVariety] = useState('');
  const [plantCategory, setPlantCategory] = useState<PlantCategory>('Vegetable');
  const [plantStatus, setPlantStatus] = useState<GardenStatus>('ToBuy');
  const [plantQuantity, setPlantQuantity] = useState('');
  const [plantSowDate, setPlantSowDate] = useState('');
  const [plantOutDate, setPlantOutDate] = useState('');
  const [plantHarvestDate, setPlantHarvestDate] = useState('');
  const [plantNotes, setPlantNotes] = useState('');

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskRecurYearly, setTaskRecurYearly] = useState(false);

  const resetPlantForm = () => {
    setPlantName(''); setPlantVariety(''); setPlantCategory('Vegetable');
    setPlantStatus('ToBuy'); setPlantQuantity(''); setPlantSowDate('');
    setPlantOutDate(''); setPlantHarvestDate(''); setPlantNotes('');
    setEditingPlantId(null); setShowPlantForm(false);
  };

  const resetTaskForm = () => {
    setTaskTitle(''); setTaskDescription(''); setTaskDueDate(''); setTaskRecurYearly(false);
    setEditingTaskId(null); setShowTaskForm(false);
  };

  const handlePlantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantName.trim()) return;
    const plant: GardenPlant = {
      id: editingPlantId || Date.now().toString(),
      name: plantName.trim(),
      variety: plantVariety.trim() || undefined,
      category: plantCategory,
      status: plantStatus,
      quantity: plantQuantity ? parseInt(plantQuantity) : undefined,
      sowDate: plantSowDate || undefined,
      plantOutDate: plantOutDate || undefined,
      harvestDate: plantHarvestDate || undefined,
      notes: plantNotes.trim() || undefined,
      createdAt: editingPlantId
        ? (plants.find(p => p.id === editingPlantId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
    };
    onSavePlant(plant);
    resetPlantForm();
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const existingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null;
    const task: GardenTask = {
      id: editingTaskId || Date.now().toString(),
      title: taskTitle.trim(),
      description: taskDescription.trim() || undefined,
      dueDate: taskDueDate || undefined,
      completed: existingTask?.completed || false,
      recurrence: taskRecurYearly ? { type: RecurrenceType.YEARLY } : undefined,
      createdAt: existingTask?.createdAt || new Date().toISOString(),
    };
    onSaveTask(task);
    resetTaskForm();
  };

  const startEditPlant = (plant: GardenPlant) => {
    setPlantName(plant.name);
    setPlantVariety(plant.variety || '');
    setPlantCategory(plant.category);
    setPlantStatus(plant.status);
    setPlantQuantity(plant.quantity?.toString() || '');
    setPlantSowDate(plant.sowDate || '');
    setPlantOutDate(plant.plantOutDate || '');
    setPlantHarvestDate(plant.harvestDate || '');
    setPlantNotes(plant.notes || '');
    setEditingPlantId(plant.id);
    setShowPlantForm(true);
  };

  const startEditTask = (task: GardenTask) => {
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskDueDate(task.dueDate || '');
    setTaskRecurYearly(task.recurrence?.type === RecurrenceType.YEARLY);
    setEditingTaskId(task.id);
    setShowTaskForm(true);
  };

  // Organize plants by status
  const plantsByStatus = useMemo(() => {
    const grouped: Record<GardenStatus, GardenPlant[]> = {
      ToBuy: [], Sowing: [], PlantOut: [], Growing: [], Harvesting: [], Complete: []
    };
    plants.forEach(plant => {
      grouped[plant.status].push(plant);
    });
    return grouped;
  }, [plants]);

  // Organize tasks
  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed).sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  }), [tasks]);

  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);

  // Calendar events
  const calendarEvents = useMemo(() => {
    const events: Array<{ date: string; type: string; item: GardenPlant | GardenTask }> = [];
    plants.forEach(plant => {
      if (plant.sowDate) events.push({ date: plant.sowDate, type: 'sow', item: plant });
      if (plant.plantOutDate) events.push({ date: plant.plantOutDate, type: 'plantOut', item: plant });
      if (plant.harvestDate) events.push({ date: plant.harvestDate, type: 'harvest', item: plant });
    });
    tasks.forEach(task => {
      if (task.dueDate) events.push({ date: task.dueDate, type: 'task', item: task });
    });
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [plants, tasks]);

  const stats = {
    totalPlants: plants.length,
    toBuy: plantsByStatus.ToBuy.length,
    sowing: plantsByStatus.Sowing.length + plantsByStatus.PlantOut.length,
    growing: plantsByStatus.Growing.length + plantsByStatus.Harvesting.length,
    pendingTasks: pendingTasks.length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">🌱 Garden Planner</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Track plants, tasks & seasons</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'plants') {
              resetPlantForm();
              setShowPlantForm(true);
            } else {
              // For tasks or calendar tab, show task form
              setActiveTab('tasks');
              resetTaskForm();
              setShowTaskForm(true);
            }
          }}
          className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm self-start sm:self-auto"
        >
          <Icon name="plus" className="w-4 h-4" />
          {activeTab === 'plants' ? 'Add Plant' : activeTab === 'tasks' ? 'Add Task' : 'Add Item'}
        </button>
      </div>

      {/* Stats */}
      {plants.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Plants', val: stats.totalPlants, color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
            { label: 'To Buy', val: stats.toBuy, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-100' },
            { label: 'Sowing/Planting', val: stats.sowing, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
            { label: 'Growing', val: stats.growing, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-2xl p-3 text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'plants' as const, label: 'Plants' },
          { id: 'tasks' as const, label: 'Tasks' },
          { id: 'calendar' as const, label: 'Calendar' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plants Tab */}
      {activeTab === 'plants' && (
        <>
          {/* Plant Form */}
          {showPlantForm && (
            <div className="bg-white border-2 border-green-100 rounded-3xl p-6 shadow-lg shadow-green-50">
              <h3 className="text-base font-black text-gray-800 mb-4">{editingPlantId ? 'Edit Plant' : 'Add New Plant'}</h3>
              <form onSubmit={handlePlantSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Plant Name</label>
                    <input
                      type="text" value={plantName} onChange={e => setPlantName(e.target.value)}
                      placeholder="e.g. Tomato"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none"
                      required autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Variety (optional)</label>
                    <input
                      type="text" value={plantVariety} onChange={e => setPlantVariety(e.target.value)}
                      placeholder="e.g. Cherry, Roma"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                    <select
                      value={plantCategory} onChange={e => setPlantCategory(e.target.value as PlantCategory)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none"
                    >
                      {PLANT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                    <select
                      value={plantStatus} onChange={e => setPlantStatus(e.target.value as GardenStatus)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none"
                    >
                      {STATUSES.map(status => (
                        <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Quantity</label>
                    <input
                      type="number" value={plantQuantity} onChange={e => setPlantQuantity(e.target.value)}
                      min="1" placeholder="1"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Sow Date</label>
                    <input
                      type="date" value={plantSowDate} onChange={e => setPlantSowDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Plant Out Date</label>
                    <input
                      type="date" value={plantOutDate} onChange={e => setPlantOutDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Harvest Date</label>
                    <input
                      type="date" value={plantHarvestDate} onChange={e => setPlantHarvestDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes (optional)</label>
                  <textarea
                    value={plantNotes} onChange={e => setPlantNotes(e.target.value)}
                    placeholder="Growing tips, location, companions..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={resetPlantForm}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 shadow-md">
                    {editingPlantId ? 'Save Changes' : 'Add Plant'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Plants by Status */}
          {plants.length === 0 && !showPlantForm ? (
            <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
              <div className="text-5xl mb-4">🌱</div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No plants yet</p>
              <p className="text-gray-300 text-xs mt-1">Add your first plant to start planning</p>
            </div>
          ) : plants.length > 0 ? (
            <div className="space-y-6">
              {STATUSES.map(status => {
                const statusPlants = plantsByStatus[status];
                if (statusPlants.length === 0) return null;
                const col = STATUS_COLORS[status];

                return (
                  <div key={status} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.dot }} />
                      <h3 className={`text-sm font-black uppercase tracking-widest ${col.text}`}>
                        {STATUS_LABELS[status]} ({statusPlants.length})
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {statusPlants.map(plant => (
                        <div key={plant.id} className="bg-white rounded-xl border-l-4 border-y border-r border-gray-200 p-3 group hover:shadow-sm transition-all"
                          style={{ borderLeftColor: col.dot }}>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm font-black text-gray-800">
                                    {plant.name}
                                    {plant.variety && <span className="text-gray-400 font-medium ml-1">({plant.variety})</span>}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                                      {plant.category}
                                    </span>
                                    {plant.quantity && (
                                      <span className="text-[10px] font-bold text-gray-500">×{plant.quantity}</span>
                                    )}
                                  </div>
                                  {(plant.sowDate || plant.plantOutDate || plant.harvestDate) && (
                                    <div className="flex flex-wrap gap-3 mt-1.5">
                                      {plant.sowDate && (
                                        <span className="text-[10px] font-bold text-amber-600">
                                          Sow: {formatDate(plant.sowDate)}
                                        </span>
                                      )}
                                      {plant.plantOutDate && (
                                        <span className="text-[10px] font-bold text-blue-600">
                                          Plant: {formatDate(plant.plantOutDate)}
                                        </span>
                                      )}
                                      {plant.harvestDate && (
                                        <span className="text-[10px] font-bold text-emerald-600">
                                          Harvest: {formatDate(plant.harvestDate)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {plant.notes && (
                                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{plant.notes}</p>
                                  )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button onClick={() => startEditPlant(plant)} className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
                                    <Icon name="edit" className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => onDeletePlant(plant.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                    <Icon name="trash" className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <>
          {/* Task Form */}
          {showTaskForm && (
            <div className="bg-white border-2 border-green-100 rounded-3xl p-6 shadow-lg shadow-green-50">
              <h3 className="text-base font-black text-gray-800 mb-4">{editingTaskId ? 'Edit Task' : 'Add New Task'}</h3>
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Task Title</label>
                  <input
                    type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                    placeholder="e.g. Water seedlings, Prune roses"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none"
                    required autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Due Date (optional)</label>
                  <input
                    type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taskRecurYearly}
                      onChange={e => setTaskRecurYearly(e.target.checked)}
                      className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-400"
                    />
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                      🔁 Repeat yearly (for seasonal tasks)
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description (optional)</label>
                  <textarea
                    value={taskDescription} onChange={e => setTaskDescription(e.target.value)}
                    placeholder="Additional details..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-green-400 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={resetTaskForm}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 shadow-md">
                    {editingTaskId ? 'Save Changes' : 'Add Task'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tasks List */}
          {tasks.length === 0 && !showTaskForm ? (
            <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No tasks yet</p>
              <p className="text-gray-300 text-xs mt-1">Add garden tasks to track your to-do list</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-green-700">
                    Pending ({pendingTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingTasks.map(task => (
                      <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-3 group hover:shadow-sm transition-all">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => onToggleTask(task.id)}
                            className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-400 flex items-center justify-center shrink-0 transition-all"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-gray-800">{task.title}</p>
                                  {task.recurrence?.type === RecurrenceType.YEARLY && (
                                    <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-lg uppercase tracking-wider" title="Repeats yearly">
                                      🔁 Yearly
                                    </span>
                                  )}
                                </div>
                                {task.dueDate && (
                                  <span className="text-[10px] font-bold text-gray-500 mt-1 block">
                                    Due: {formatDate(task.dueDate)}
                                  </span>
                                )}
                                {task.description && (
                                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{task.description}</p>
                                )}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button onClick={() => startEditTask(task)} className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
                                  <Icon name="edit" className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDeleteTask(task.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                  <Icon name="trash" className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {completedTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                    Completed ({completedTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {completedTasks.map(task => (
                      <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-3 opacity-60">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => onToggleTask(task.id)}
                            className="mt-0.5 w-5 h-5 rounded-full border-2 bg-green-500 border-green-500 flex items-center justify-center shrink-0"
                          >
                            <Icon name="check" className="w-3 h-3 text-white" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-400 line-through">{task.title}</p>
                            {task.description && (
                              <p className="text-[11px] text-gray-300 mt-1 line-through">{task.description}</p>
                            )}
                          </div>
                          <button onClick={() => onDeleteTask(task.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                            <Icon name="trash" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {calendarEvents.length === 0 ? (
            <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
              <div className="text-5xl mb-4">📅</div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No scheduled events</p>
              <p className="text-gray-300 text-xs mt-1">Add dates to plants and tasks to see them here</p>
            </div>
          ) : (
            calendarEvents.map(event => {
              const isPlant = 'status' in event.item;
              const eventLabel = isPlant
                ? event.type === 'sow' ? '🌱 Sow' : event.type === 'plantOut' ? '🌿 Plant Out' : '🌾 Harvest'
                : '✅ Task';
              const eventColor = event.type === 'sow' ? 'amber' : event.type === 'plantOut' ? 'blue' : event.type === 'harvest' ? 'emerald' : 'green';

              return (
                <div key={`${event.type}-${event.item.id}`} className={`bg-white rounded-xl border-l-4 border-${eventColor}-500 border-y border-r border-gray-200 p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest text-${eventColor}-700`}>
                          {eventLabel}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">
                          {formatDate(event.date)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        {isPlant ? (event.item as GardenPlant).name : (event.item as GardenTask).title}
                      </p>
                      {isPlant && (event.item as GardenPlant).variety && (
                        <p className="text-[11px] text-gray-500 mt-0.5">Variety: {(event.item as GardenPlant).variety}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default GardenPlanner;
