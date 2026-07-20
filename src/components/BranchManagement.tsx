import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Building2 } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

interface BranchManagementProps {
  onBack?: () => void;
}

const lsGet = <T,>(key: string, fallback: T): T => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const lsSet = (key: string, val: unknown) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

export default function BranchManagement({ onBack }: BranchManagementProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');

  useEffect(() => {
    setBranches(lsGet<Branch[]>('pos_branches', []));
  }, []);

  const save = (updated: Branch[]) => {
    setBranches(updated);
    lsSet('pos_branches', updated);
  };

  const handleAdd = () => {
    const name = formName.trim();
    const code = formCode.trim().toUpperCase();
    if (!name || !code) { alert('Please enter branch name and code'); return; }
    if (branches.some(b => b.code === code)) { alert('Branch code already exists'); return; }

    const newBranch: Branch = {
      id: `branch_${Date.now()}`,
      name,
      code,
      is_active: true,
      created_at: new Date().toISOString()
    };
    save([...branches, newBranch]);
    setFormName('');
    setFormCode('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this branch?')) return;
    save(branches.filter(b => b.id !== id));
  };

  const startEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setEditName(branch.name);
    setEditCode(branch.code);
  };

  const handleSaveEdit = (id: string) => {
    const name = editName.trim();
    const code = editCode.trim().toUpperCase();
    if (!name || !code) { alert('Name and code required'); return; }
    if (branches.some(b => b.code === code && b.id !== id)) { alert('Branch code already exists'); return; }
    save(branches.map(b => b.id === id ? { ...b, name, code } : b));
    setEditingId(null);
  };

  const toggleActive = (id: string) => {
    save(branches.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button onClick={onBack} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm flex items-center space-x-1">
              <span>←</span><span>Back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Branch Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Branch</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-700 p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">New Branch</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch Name *</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Main Branch"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch Code *</label>
              <input
                type="text"
                value={formCode}
                onChange={e => setFormCode(e.target.value)}
                placeholder="e.g. MAIN"
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button onClick={handleAdd} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Check className="w-4 h-4" /><span>Save</span>
            </button>
            <button onClick={() => { setShowAddForm(false); setFormName(''); setFormCode(''); }} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <X className="w-4 h-4" /><span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Branches List */}
      {branches.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No branches yet</p>
          <p className="text-sm mt-1">Click "Add Branch" to create your first branch</p>
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              {editingId === branch.id ? (
                <div className="flex items-center space-x-3 flex-1 mr-4">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    value={editCode}
                    onChange={e => setEditCode(e.target.value)}
                    maxLength={10}
                    className="w-24 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{branch.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Code: {branch.code}</p>
                  </div>
                  <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${branch.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {branch.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {editingId === branch.id ? (
                  <>
                    <button onClick={() => handleSaveEdit(branch.id)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => toggleActive(branch.id)} className={`px-3 py-1 text-xs rounded-lg border transition-colors ${branch.is_active ? 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700' : 'border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'}`}>
                      {branch.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => startEdit(branch)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(branch.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
