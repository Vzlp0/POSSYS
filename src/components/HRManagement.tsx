import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Users, Plus, Edit, Trash2, Save, X, Search, Shield, GitBranch,
  Check, AlertCircle, Eye, EyeOff, Building2
} from 'lucide-react';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  job_title: string | null;
  branch_id: string | null;
  role: string | null;
  is_active: boolean;
  manager_id: string | null;
  permissions: {
    can_view_reports?: boolean;
    can_approve_pr?: boolean;
    can_create_po?: boolean;
    cashier_access?: boolean;
    inventory_access?: boolean;
    hr_access?: boolean;
  };
  branches?: { name: string };
  manager?: { first_name: string; last_name: string };
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

export default function HRManagement() {
  const { isDarkMode } = useTheme();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'reporting' | 'access'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    job_title: '',
    branch_id: '',
    role: 'staff',
    is_active: true,
    manager_id: ''
  });

  const roles = ['admin', 'hr_admin', 'manager', 'cashier', 'viewer'];

  useEffect(() => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'hr_admin') {
      alert('Access denied. This page is only accessible to Administrators and HR Admins.');
      return;
    }
    fetchUsers();
    fetchBranches();
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          branches(name),
          manager:users!manager_id(first_name, last_name)
        `)
        .order('first_name');

      if (error) throw error;

      const normalizedUsers = (data || []).map(user => ({
        ...user,
        permissions: typeof user.permissions === 'object' && user.permissions !== null
          ? user.permissions
          : {
              can_view_reports: false,
              can_approve_pr: false,
              can_create_po: false,
              cashier_access: false,
              inventory_access: false,
              hr_access: false
            }
      }));

      setUsers(normalizedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleAddUser = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      alert('Please fill in all required fields (Name and Email)');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .insert([{
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          job_title: formData.job_title || null,
          branch_id: formData.branch_id || null,
          role: formData.role,
          is_active: formData.is_active,
          manager_id: formData.manager_id || null,
          username: formData.email,
          permissions: {
            can_view_reports: false,
            can_approve_pr: false,
            can_create_po: false,
            cashier_access: formData.role === 'cashier',
            inventory_access: false,
            hr_access: false
          }
        }]);

      if (error) throw error;

      await fetchUsers();
      setShowAddModal(false);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        job_title: '',
        branch_id: '',
        role: 'staff',
        is_active: true,
        manager_id: ''
      });
      alert('User added successfully!');
    } catch (error: any) {
      console.error('Error adding user:', error);
      alert(`Failed to add user: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateManager = async (userId: string, managerId: string) => {
    if (userId === managerId) {
      alert('A user cannot be their own manager');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ manager_id: managerId || null })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      alert('Reporting line updated successfully!');
    } catch (error: any) {
      console.error('Error updating manager:', error);
      alert(`Failed to update reporting line: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      alert('User role updated successfully!');
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert(`Failed to update role: ${error.message || 'Unknown error'}`);
    }
  };

  const handleTogglePermission = async (userId: string, permission: string, currentValue: boolean) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const basePermissions = typeof user.permissions === 'object' && user.permissions !== null
        ? user.permissions
        : {
            can_view_reports: false,
            can_approve_pr: false,
            can_create_po: false,
            cashier_access: false,
            inventory_access: false,
            hr_access: false
          };

      const updatedPermissions = {
        can_view_reports: basePermissions.can_view_reports || false,
        can_approve_pr: basePermissions.can_approve_pr || false,
        can_create_po: basePermissions.can_create_po || false,
        cashier_access: basePermissions.cashier_access || false,
        inventory_access: basePermissions.inventory_access || false,
        hr_access: basePermissions.hr_access || false,
        [permission]: !currentValue
      };

      const { error } = await supabase
        .from('users')
        .update({ permissions: updatedPermissions })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating permission:', error);
      alert(`Failed to update permission: ${error.message || 'Unknown error'}`);
    }
  };

  const handleResetPassword = async (userId: string, password: string) => {
    if (!password || password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to reset passwords');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          newPassword: password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      alert('Password reset successfully!');
      setShowEditModal(false);
      setEditingUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert(`Failed to reset password: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      alert('User deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error.message || 'Unknown error'}`);
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name} ${user.email} ${user.job_title}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getUserName = (user: User | null | undefined) => {
    if (!user) return 'N/A';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A';
  };

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
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            HR Management
          </h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage users, reporting lines, and access permissions
          </p>
        </div>

        <div className={`border-b mb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('reporting')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'reporting'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <GitBranch className="w-4 h-4 inline mr-2" />
              Reporting Lines
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'access'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Access & Roles
            </button>
          </nav>
        </div>

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>

            <div className={`rounded-lg border overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Full Name
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Job Title
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Branch
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Email
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Status
                      </th>
                      <th className={`px-6 py-3 text-right text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`px-6 py-8 text-center ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className={`px-6 py-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            <div className="font-medium">
                              {getUserName(user)}
                            </div>
                          </td>
                          <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {user.job_title || '-'}
                          </td>
                          <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {user.branches?.name || '-'}
                          </td>
                          <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setNewPassword('');
                                  setShowEditModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                title="Edit User"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reporting' && (
          <div>
            <div className={`mb-4 p-4 rounded-lg border ${
              isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start space-x-3">
                <AlertCircle className={`w-5 h-5 mt-0.5 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                    Set reporting relationships for approval workflows. Changes are saved automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg border overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Employee Name
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Position
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Line Manager
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {users.map((user) => (
                      <tr key={user.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <div className="font-medium">
                            {getUserName(user)}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.email}
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {user.job_title || 'Not Set'}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.manager_id || ''}
                            onChange={(e) => handleUpdateManager(user.id, e.target.value)}
                            className={`px-3 py-2 rounded-lg border ${
                              isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">No Manager</option>
                            {users
                              .filter(u => u.id !== user.id)
                              .map(u => (
                                <option key={u.id} value={u.id}>
                                  {getUserName(u)} - {u.job_title || 'No Title'}
                                </option>
                              ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div>
            <div className={`mb-4 p-4 rounded-lg border ${
              isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start space-x-3">
                <AlertCircle className={`w-5 h-5 mt-0.5 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                    Manage user roles and permissions. Changes are saved automatically when you toggle a permission.
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg border overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Name
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Role
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Permissions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {users.map((user) => (
                      <tr key={user.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <div className="font-medium">
                            {getUserName(user)}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role || 'staff'}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            className={`px-3 py-2 rounded-lg border capitalize ${
                              isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            {roles.map(role => (
                              <option key={role} value={role} className="capitalize">
                                {role}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={user.permissions?.can_view_reports || false}
                                onChange={() => handleTogglePermission(user.id, 'can_view_reports', user.permissions?.can_view_reports || false)}
                                className="rounded"
                              />
                              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                View Reports
                              </span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={user.permissions?.can_approve_pr || false}
                                onChange={() => handleTogglePermission(user.id, 'can_approve_pr', user.permissions?.can_approve_pr || false)}
                                className="rounded"
                              />
                              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Approve PR
                              </span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={user.permissions?.can_create_po || false}
                                onChange={() => handleTogglePermission(user.id, 'can_create_po', user.permissions?.can_create_po || false)}
                                className="rounded"
                              />
                              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Create PO
                              </span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={user.permissions?.cashier_access || false}
                                onChange={() => handleTogglePermission(user.id, 'cashier_access', user.permissions?.cashier_access || false)}
                                className="rounded"
                              />
                              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Cashier Access
                              </span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={user.permissions?.inventory_access || false}
                                onChange={() => handleTogglePermission(user.id, 'inventory_access', user.permissions?.inventory_access || false)}
                                className="rounded"
                              />
                              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Inventory Access
                              </span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={user.permissions?.hr_access || false}
                                onChange={() => handleTogglePermission(user.id, 'hr_access', user.permissions?.hr_access || false)}
                                className="rounded"
                              />
                              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                HR Access
                              </span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Add New User
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
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
                  Branch
                </label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">No Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border capitalize ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {roles.map(role => (
                    <option key={role} value={role} className="capitalize">
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Line Manager
                </label>
                <select
                  value={formData.manager_id}
                  onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">No Manager</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {getUserName(u)} - {u.job_title || 'No Title'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                <label htmlFor="is_active" className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Edit User
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setNewPassword('');
                }}
                className={isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className={`w-full px-3 py-2 border rounded-lg opacity-60 cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300'
                      : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Name
                </label>
                <input
                  type="text"
                  value={getUserName(editingUser)}
                  disabled
                  className={`w-full px-3 py-2 border rounded-lg opacity-60 cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300'
                      : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                />
              </div>

              {(currentUser?.role === 'admin' || currentUser?.role === 'hr_admin') && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Leave blank to keep current password. Minimum 6 characters.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setNewPassword('');
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
                  onClick={() => handleResetPassword(editingUser.id, newPassword)}
                  disabled={!newPassword || newPassword.length < 6}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
