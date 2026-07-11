import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Users, UserCheck, FileCheck, Building2, Search, Edit, Eye, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: string;
  branch_id: string;
  line_manager_id: string | null;
  approver_id: string | null;
  reports_to: string | null;
  branch?: {
    name: string;
    code: string;
  };
}

interface EmployeeStructureProps {
  onBack: () => void;
}

export default function EmployeeStructure({ onBack }: EmployeeStructureProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    line_manager_id: '',
    approver_id: '',
    reports_to: '',
    branch_id: '',
    department: '',
    position: ''
  });

  useEffect(() => {
    if (user?.role !== 'hr_admin' && user?.role !== 'admin') {
      alert('Access denied. This page is only accessible to HR Admins.');
      onBack();
      return;
    }
    fetchEmployees();
    fetchBranches();
  }, [user]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          branch:branches(name, code)
        `)
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Failed to load employees');
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

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      line_manager_id: employee.line_manager_id || '',
      approver_id: employee.approver_id || '',
      reports_to: employee.reports_to || '',
      branch_id: employee.branch_id || '',
      department: employee.department || '',
      position: employee.position || ''
    });
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!selectedEmployee) return;

    // Validation: Prevent self-assignment
    if (formData.line_manager_id === selectedEmployee.id ||
        formData.approver_id === selectedEmployee.id ||
        formData.reports_to === selectedEmployee.id) {
      alert('An employee cannot be their own manager, approver, or report to themselves.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('employees')
        .update({
          line_manager_id: formData.line_manager_id || null,
          approver_id: formData.approver_id || null,
          reports_to: formData.reports_to || null,
          branch_id: formData.branch_id || null,
          department: formData.department,
          position: formData.position,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      alert('Employee structure updated successfully!');
      setEditMode(false);
      await fetchEmployees();

      // Update selected employee
      const updated = employees.find(e => e.id === selectedEmployee.id);
      if (updated) handleSelectEmployee(updated);
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee structure');
    } finally {
      setSaving(false);
    }
  };

  const getEmployeeName = (id: string | null) => {
    if (!id) return 'Not Assigned';
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
  };

  const getEmployeesByManager = (managerId: string | null) => {
    return employees.filter(e => e.reports_to === managerId);
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (employee: Employee, level: number = 0) => {
    const directReports = getEmployeesByManager(employee.id);
    const hasReports = directReports.length > 0;
    const isExpanded = expandedNodes.has(employee.id);

    return (
      <div key={employee.id} className="mb-2">
        <div
          className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
            selectedEmployee?.id === employee.id
              ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700'
              : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750'
          }`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => handleSelectEmployee(employee)}
        >
          {hasReports && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(employee.id);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasReports && <div className="w-6" />}

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-gray-900 dark:text-white">
                {employee.first_name} {employee.last_name}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {employee.position || 'No Position'} • {employee.department || 'No Department'}
            </div>
          </div>

          {hasReports && (
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
              {directReports.length} {directReports.length === 1 ? 'report' : 'reports'}
            </span>
          )}
        </div>

        {isExpanded && hasReports && (
          <div className="mt-2">
            {directReports.map(report => renderTreeNode(report, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name} ${emp.email} ${emp.department} ${emp.position}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const topLevelEmployees = employees.filter(e => !e.reports_to);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to HR</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Structure</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage reporting relationships and organizational hierarchy</p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              Tree View
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Employee List/Tree */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employees..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {viewMode === 'list' ? (
                filteredEmployees.map(employee => (
                  <div
                    key={employee.id}
                    onClick={() => handleSelectEmployee(employee)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedEmployee?.id === employee.id
                        ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700'
                        : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {employee.first_name} {employee.last_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {employee.position || 'No Position'} • {employee.department || 'No Department'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{employee.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  {topLevelEmployees.length > 0 ? (
                    topLevelEmployees.map(emp => renderTreeNode(emp, 0))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No organizational hierarchy defined yet.</p>
                      <p className="text-sm">Assign reporting relationships to see the tree.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Employee Details & Edit */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {selectedEmployee ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h2>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Structure</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Employee Number:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedEmployee.employee_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedEmployee.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedEmployee.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedEmployee.status || 'Active'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Position & Department */}
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Position & Department</h3>

                    {editMode ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Position Title
                          </label>
                          <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Senior Manager"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Department
                          </label>
                          <input
                            type="text"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Sales, IT, HR"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Building2 className="w-4 h-4 inline mr-2" />
                            Branch
                          </label>
                          <select
                            value={formData.branch_id}
                            onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">No Branch</option>
                            {branches.map(branch => (
                              <option key={branch.id} value={branch.id}>
                                {branch.name} ({branch.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Position:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedEmployee.position || 'Not Set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Department:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedEmployee.department || 'Not Set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Branch:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedEmployee.branch?.name || 'Not Assigned'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reporting Structure */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Reporting Structure</h3>

                    {editMode ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Users className="w-4 h-4 inline mr-2" />
                            Line Manager
                          </label>
                          <select
                            value={formData.line_manager_id}
                            onChange={(e) => setFormData({ ...formData, line_manager_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">No Line Manager</option>
                            {employees
                              .filter(e => e.id !== selectedEmployee.id)
                              .map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.first_name} {emp.last_name} - {emp.position || 'No Position'}
                                </option>
                              ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Direct manager for day-to-day operations</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <FileCheck className="w-4 h-4 inline mr-2" />
                            Approver
                          </label>
                          <select
                            value={formData.approver_id}
                            onChange={(e) => setFormData({ ...formData, approver_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">No Approver</option>
                            {employees
                              .filter(e => e.id !== selectedEmployee.id)
                              .map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.first_name} {emp.last_name} - {emp.position || 'No Position'}
                                </option>
                              ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Approves PRs, expenses, and requests</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <UserCheck className="w-4 h-4 inline mr-2" />
                            Reports To
                          </label>
                          <select
                            value={formData.reports_to}
                            onChange={(e) => setFormData({ ...formData, reports_to: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">No Reporting Manager</option>
                            {employees
                              .filter(e => e.id !== selectedEmployee.id)
                              .map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.first_name} {emp.last_name} - {emp.position || 'No Position'}
                                </option>
                              ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Organizational reporting for HR hierarchy</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Line Manager</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {getEmployeeName(selectedEmployee.line_manager_id)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Approver</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {getEmployeeName(selectedEmployee.approver_id)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Reports To</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {getEmployeeName(selectedEmployee.reports_to)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Direct Reports Count */}
                  {!editMode && (
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Direct Reports</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {getEmployeesByManager(selectedEmployee.id).length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Eye className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Select an employee</p>
                <p className="text-sm">Choose an employee from the list to view or edit their structure</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
