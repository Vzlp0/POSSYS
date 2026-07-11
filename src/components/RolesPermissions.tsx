import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, Shield, Users, Lock, Check, X, Edit, Save, Plus, Trash2, AlertCircle
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  user_count?: number;
}

interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

interface RolesPermissionsProps {
  onBack: () => void;
}

const availablePermissions: Permission[] = [
  { id: 'dashboard_view', module: 'Dashboard', action: 'View', description: 'View dashboard and analytics' },
  { id: 'pos_access', module: 'POS', action: 'Access', description: 'Access point of sale system' },
  { id: 'pos_refund', module: 'POS', action: 'Refund', description: 'Process refunds and returns' },
  { id: 'pos_discount', module: 'POS', action: 'Discount', description: 'Apply discounts to transactions' },
  { id: 'inventory_view', module: 'Inventory', action: 'View', description: 'View inventory items' },
  { id: 'inventory_edit', module: 'Inventory', action: 'Edit', description: 'Add, edit, delete inventory items' },
  { id: 'inventory_adjust', module: 'Inventory', action: 'Adjust', description: 'Adjust stock quantities' },
  { id: 'procurement_view', module: 'Procurement', action: 'View', description: 'View purchase orders and requisitions' },
  { id: 'procurement_create', module: 'Procurement', action: 'Create', description: 'Create purchase requests' },
  { id: 'procurement_approve', module: 'Procurement', action: 'Approve', description: 'Approve purchase requests' },
  { id: 'suppliers_view', module: 'Suppliers', action: 'View', description: 'View supplier information' },
  { id: 'suppliers_manage', module: 'Suppliers', action: 'Manage', description: 'Add, edit supplier details' },
  { id: 'finance_view', module: 'Finance', action: 'View', description: 'View financial reports' },
  { id: 'finance_manage', module: 'Finance', action: 'Manage', description: 'Manage payments and transactions' },
  { id: 'reports_view', module: 'Reports', action: 'View', description: 'View all reports' },
  { id: 'reports_export', module: 'Reports', action: 'Export', description: 'Export reports to files' },
  { id: 'users_view', module: 'Users', action: 'View', description: 'View user accounts' },
  { id: 'users_manage', module: 'Users', action: 'Manage', description: 'Create, edit, delete users' },
  { id: 'hr_view', module: 'HR', action: 'View', description: 'View employee information' },
  { id: 'hr_manage', module: 'HR', action: 'Manage', description: 'Manage employees and structure' },
  { id: 'settings_view', module: 'Settings', action: 'View', description: 'View system settings' },
  { id: 'settings_manage', module: 'Settings', action: 'Manage', description: 'Modify system settings' },
  { id: 'clients_view', module: 'Clients', action: 'View', description: 'View client information' },
  { id: 'clients_manage', module: 'Clients', action: 'Manage', description: 'Add, edit client details' },
  { id: 'tasks_view', module: 'Tasks', action: 'View', description: 'View tasks' },
  { id: 'tasks_manage', module: 'Tasks', action: 'Manage', description: 'Create, assign, edit tasks' },
  { id: 'cameras_view', module: 'Cameras', action: 'View', description: 'View camera feeds' },
  { id: 'cameras_manage', module: 'Cameras', action: 'Manage', description: 'Manage camera settings' }
];

const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: availablePermissions.map(p => p.id)
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Manage operations, approve requests, view reports',
    permissions: [
      'dashboard_view', 'pos_access', 'pos_refund', 'pos_discount',
      'inventory_view', 'inventory_edit', 'inventory_adjust',
      'procurement_view', 'procurement_create', 'procurement_approve',
      'suppliers_view', 'finance_view', 'reports_view', 'reports_export',
      'clients_view', 'clients_manage', 'tasks_view', 'tasks_manage',
      'cameras_view'
    ]
  },
  {
    id: 'cashier',
    name: 'Cashier',
    description: 'Operate POS, view inventory, manage clients',
    permissions: [
      'dashboard_view', 'pos_access', 'inventory_view',
      'clients_view', 'clients_manage', 'tasks_view'
    ]
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Basic access to inventory and tasks',
    permissions: [
      'dashboard_view', 'inventory_view', 'tasks_view'
    ]
  },
  {
    id: 'hr_admin',
    name: 'HR Administrator',
    description: 'Manage employees, structure, and HR functions',
    permissions: [
      'dashboard_view', 'users_view', 'users_manage',
      'hr_view', 'hr_manage', 'reports_view'
    ]
  }
];

export default function RolesPermissions({ onBack }: RolesPermissionsProps) {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      alert('Access denied. Only administrators can manage roles and permissions.');
      onBack();
      return;
    }
    fetchUserCounts();
  }, [user]);

  const fetchUserCounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('role');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(user => {
        counts[user.role] = (counts[user.role] || 0) + 1;
      });

      setUserCounts(counts);

      const updatedRoles = roles.map(role => ({
        ...role,
        user_count: counts[role.id] || 0
      }));
      setRoles(updatedRoles);
    } catch (error) {
      console.error('Error fetching user counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setEditMode(false);
  };

  const handleTogglePermission = (permissionId: string) => {
    if (formData.permissions.includes(permissionId)) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => p !== permissionId)
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permissionId]
      });
    }
  };

  const handleSave = () => {
    if (!selectedRole) return;

    if (!formData.name.trim()) {
      alert('Please enter a role name');
      return;
    }

    const updatedRole: Role = {
      ...selectedRole,
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions
    };

    const updatedRoles = roles.map(r =>
      r.id === selectedRole.id ? updatedRole : r
    );

    setRoles(updatedRoles);
    setSelectedRole(updatedRole);
    setEditMode(false);
    alert('Role updated successfully! Note: Changes are stored in local state. Implement backend sync for production.');
  };

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={onBack}
            className={`flex items-center space-x-2 mb-2 ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to HR</span>
          </button>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Roles & Permissions
          </h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage user roles and their access permissions
          </p>
        </div>

        <div className={`mb-6 p-4 rounded-lg border ${
          isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`}>
                Important Information
              </h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                Role permissions control what users can see and do in the system. Changes affect all users with that role.
                The actual permission enforcement needs to be implemented in your backend/API layer for security.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-lg border p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              System Roles
            </h2>

            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedRole?.id === role.id
                      ? isDarkMode
                        ? 'bg-blue-900/20 border-blue-700'
                        : 'bg-blue-50 border-blue-300'
                      : isDarkMode
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Shield className={`w-5 h-5 mt-0.5 ${
                        selectedRole?.id === role.id
                          ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                      <div>
                        <h3 className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {role.name}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {role.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`text-xs ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {role.permissions.length} permissions
                          </span>
                          <span className={`text-xs flex items-center space-x-1 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            <Users className="w-3 h-3" />
                            <span>{role.user_count || 0} users</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-lg border p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {selectedRole ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedRole.name}
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedRole.description}
                    </p>
                  </div>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setFormData({
                            name: selectedRole.name,
                            description: selectedRole.description,
                            permissions: [...selectedRole.permissions]
                          });
                        }}
                        className={`px-4 py-2 rounded-lg ${
                          isDarkMode
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                    </div>
                  )}
                </div>

                {editMode && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Role Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Permissions
                  </h3>

                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                    {Object.entries(groupedPermissions).map(([module, perms]) => (
                      <div key={module}>
                        <h4 className={`text-sm font-medium mb-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {module}
                        </h4>
                        <div className="space-y-2">
                          {perms.map((permission) => {
                            const isGranted = formData.permissions.includes(permission.id);
                            return (
                              <label
                                key={permission.id}
                                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                  editMode
                                    ? isGranted
                                      ? isDarkMode
                                        ? 'bg-green-900/20 border-green-700 hover:bg-green-900/30'
                                        : 'bg-green-50 border-green-300 hover:bg-green-100'
                                      : isDarkMode
                                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    : isDarkMode
                                      ? 'bg-gray-700 border-gray-600'
                                      : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isGranted}
                                  onChange={() => editMode && handleTogglePermission(permission.id)}
                                  disabled={!editMode}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-sm font-medium ${
                                      isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                      {permission.action}
                                    </span>
                                    {isGranted && (
                                      <Check className={`w-4 h-4 ${
                                        isDarkMode ? 'text-green-400' : 'text-green-600'
                                      }`} />
                                    )}
                                  </div>
                                  <p className={`text-xs mt-1 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {permission.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center py-12 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Lock className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a role</p>
                <p className="text-sm">Choose a role to view and edit its permissions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
