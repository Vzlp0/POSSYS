import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface UserManagementProps {
  onBack?: () => void;
}

export default function UserManagement({ onBack }: UserManagementProps = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedUsers = (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        role: u.role || 'staff',
        department: u.department || '',
        phone: u.phone || '',
        isActive: u.is_active !== false,
        isPending: u.is_pending === true,
        createdAt: u.created_at,
        approvedBy: u.approved_by || null,
        approvedAt: u.approved_at || null
      }));

      setUsers(mappedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      alert(`Failed to load users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: true,
          is_pending: false,
          role: role,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      alert('User approved successfully!');
    } catch (error: any) {
      console.error('Error approving user:', error);
      alert(`Failed to approve user: ${error.message}`);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? This will permanently delete their account.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      alert('User rejected and deleted successfully!');
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      alert(`Failed to reject user: ${error.message}`);
    }
  };
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && user.isActive && !user.isPending) ||
      (selectedStatus === 'inactive' && !user.isActive && !user.isPending) ||
      (selectedStatus === 'pending' && user.isPending);
    
    return matchesSearch && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cashier': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'staff': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.isPending) {
      return (
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-600 font-medium">Pending Approval</span>
        </div>
      );
    }
    
    if (user.isActive) {
      return (
        <div className="flex items-center space-x-2">
          <UserCheck className="w-5 h-5 text-green-600" />
          <span className="text-green-600 font-medium">Active</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2">
        <UserX className="w-5 h-5 text-red-600" />
        <span className="text-red-600 font-medium">Inactive</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to HR</span>
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage system users and their permissions</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">User</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Role</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Department</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Created</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-all">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-700 font-medium text-sm">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {user.firstName} {user.lastName}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Phone className="w-4 h-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border capitalize ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-900 dark:text-gray-100">{user.department || '-'}</span>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(user)}
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-900 dark:text-gray-100">
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {user.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <select
                            onChange={(e) => handleApproveUser(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                            defaultValue=""
                          >
                            <option value="" disabled>Select Role</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="cashier">Cashier</option>
                            <option value="staff">Staff</option>
                          </select>
                        </div>
                        <button 
                          onClick={() => handleRejectUser(user.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Reject User"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Pending Approvals Summary */}
      {users.filter(u => u.isPending).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                {users.filter(u => u.isPending).length} User(s) Awaiting Approval
              </h3>
              <p className="text-yellow-700">
                Review and approve new user registrations to grant system access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}