import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Calendar, Users, BarChart3, Bell, CreditCard as Edit, Trash2, MessageSquare, Clock, AlertCircle, CheckCircle2, Filter, Download, Image, CheckSquare, Send, X } from 'lucide-react';
import { Task, Employee, TaskComment, TaskTemplate, TaskStep, TaskAttachment } from '../types';
import { useAuth } from '../contexts/AuthContext';

// localStorage helpers
const lsGet = <T,>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};
const lsSet = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const lsAppend = <T,>(key: string, item: T): T[] => {
  const arr = lsGet<T>(key);
  arr.push(item);
  lsSet(key, arr);
  return arr;
};

export default function TaskManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'master' | 'my-tasks' | 'dashboard' | 'daily' | 'reports'>('master');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = () => {
    try {
      setIsLoading(true);
      fetchTasks();
      fetchEmployees();
      fetchTemplates();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = () => {
    const data = lsGet<Task>('pos_tasks');
    const emps = lsGet<Employee>('pos_employees');
    const enriched = data
      .map(t => ({ ...t, employee: emps.find(e => e.id === t.assigned_to) || null }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setTasks(enriched);
  };

  const fetchEmployees = () => {
    const data = lsGet<Employee>('pos_employees')
      .filter(e => e.status === 'active')
      .sort((a, b) => a.first_name.localeCompare(b.first_name));
    setEmployees(data);
  };

  const fetchTemplates = () => {
    const emps = lsGet<Employee>('pos_employees');
    const data = lsGet<TaskTemplate>('pos_task_templates')
      .filter(t => t.is_active)
      .map(t => ({ ...t, employee: emps.find(e => e.id === t.assigned_to) || null }));
    setTemplates(data);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'my-tasks') {
      // In a real app, you'd filter by current employee
      return true;
    }
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterEmployee !== 'all' && task.assigned_to !== filterEmployee) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Task Management</h1>
            <p className="text-gray-600 mt-1">Organize and track team tasks efficiently</p>
          </div>
          {(activeTab === 'master' || activeTab === 'dashboard') && (
            <button
              onClick={() => setShowTaskModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Task</span>
            </button>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'master'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Task Master</span>
          </button>
          <button
            onClick={() => setActiveTab('my-tasks')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'my-tasks'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>My Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Daily Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Download className="w-5 h-5" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'master' && (
          <TaskMaster
            tasks={filteredTasks}
            employees={employees}
            onEdit={(task) => {
              setSelectedTask(task);
              setShowTaskModal(true);
            }}
            onRefresh={fetchTasks}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
          />
        )}

        {activeTab === 'my-tasks' && (
          <MyTasks
            tasks={filteredTasks}
            onRefresh={fetchTasks}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
          />
        )}

        {activeTab === 'dashboard' && (
          <ManagerDashboard
            tasks={tasks}
            employees={employees}
            stats={stats}
            filterStatus={filterStatus}
            filterPriority={filterPriority}
            filterEmployee={filterEmployee}
            setFilterStatus={setFilterStatus}
            setFilterPriority={setFilterPriority}
            setFilterEmployee={setFilterEmployee}
            filteredTasks={filteredTasks}
            onEdit={(task) => {
              setSelectedTask(task);
              setShowTaskModal(true);
            }}
            onRefresh={fetchTasks}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
          />
        )}

        {activeTab === 'daily' && (
          <DailyTaskLog
            templates={templates}
            employees={employees}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'reports' && (
          <TaskReports
            tasks={tasks}
            employees={employees}
            stats={stats}
          />
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          employees={employees}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSave={fetchTasks}
          currentUser={user}
        />
      )}
    </div>
  );
}

interface TaskMasterProps {
  tasks: Task[];
  employees: Employee[];
  onEdit: (task: Task) => void;
  onRefresh: () => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

function TaskMaster({ tasks, employees, onEdit, onRefresh, getPriorityColor, getStatusColor }: TaskMasterProps) {
  const handleDelete = (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const all = lsGet<any>('pos_tasks');
      lsSet('pos_tasks', all.filter((t: any) => t.id !== taskId));
      alert('Task deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 dark:bg-gray-900">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
                      <p className="text-sm text-gray-500">{task.task_number}</p>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {task.employee ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {task.employee.first_name} {task.employee.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{task.employee.position}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {task.deadline ? (
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(task.deadline).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No deadline</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEdit(task)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface MyTasksProps {
  tasks: Task[];
  onRefresh: () => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

function MyTasks({ tasks, onRefresh, getPriorityColor, getStatusColor }: MyTasksProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);

  const updateTaskStatus = (taskId: string, newStatus: string) => {
    try {
      const all = lsGet<any>('pos_tasks');
      lsSet('pos_tasks', all.map((t: any) => {
        if (t.id !== taskId) return t;
        const updates: any = { ...t, status: newStatus };
        if (newStatus === 'in_progress' && !t.started_at) updates.started_at = new Date().toISOString();
        if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
        return updates;
      }));
      alert('Task status updated');
      onRefresh();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status');
    }
  };

  const addComment = () => {
    if (!selectedTask || !newComment.trim()) return;

    try {
      lsAppend('pos_task_comments', {
        id: Date.now().toString(),
        task_id: selectedTask.id,
        comment: newComment,
        created_by: 'Current User',
        created_at: new Date().toISOString()
      });
      setNewComment('');
      loadComments(selectedTask.id);
      alert('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const loadComments = (taskId: string) => {
    const data = lsGet<TaskComment>('pos_task_comments')
      .filter(c => c.task_id === taskId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setComments(data);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{task.title}</h3>
                <p className="text-xs text-gray-500">{task.task_number}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            {task.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{task.description}</p>
            )}

            <div className="space-y-3 mb-4">
              {task.deadline && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Due: {new Date(task.deadline).toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border-0 ${getStatusColor(task.status)}`}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedTask(task);
                setShowComments(true);
                loadComments(task.id);
              }}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>View Comments</span>
            </button>
          </div>
        ))}
      </div>

      {showComments && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedTask.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comments & Updates</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{comment.created_by}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{comment.comment}</p>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No comments yet. Be the first to add one!
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                />
                <button
                  onClick={addComment}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
              <button
                onClick={() => {
                  setShowComments(false);
                  setSelectedTask(null);
                  setComments([]);
                }}
                className="w-full mt-3 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ManagerDashboardProps {
  tasks: Task[];
  employees: Employee[];
  stats: any;
  filterStatus: string;
  filterPriority: string;
  filterEmployee: string;
  setFilterStatus: (value: string) => void;
  setFilterPriority: (value: string) => void;
  setFilterEmployee: (value: string) => void;
  filteredTasks: Task[];
  onEdit: (task: Task) => void;
  onRefresh: () => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

function ManagerDashboard({
  tasks,
  employees,
  stats,
  filterStatus,
  filterPriority,
  filterEmployee,
  setFilterStatus,
  setFilterPriority,
  setFilterEmployee,
  filteredTasks,
  onEdit,
  onRefresh,
  getPriorityColor,
  getStatusColor
}: ManagerDashboardProps) {
  const reassignTask = (taskId: string, newEmployeeId: string) => {
    try {
      const all = lsGet<any>('pos_tasks');
      lsSet('pos_tasks', all.map((t: any) => t.id === taskId ? { ...t, assigned_to: newEmployeeId } : t));
      alert('Task reassigned successfully');
      onRefresh();
    } catch (error) {
      console.error('Error reassigning task:', error);
      alert('Failed to reassign task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.in_progress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{task.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  )}
                  <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                    <span>Assigned: {task.employee ? `${task.employee.first_name} ${task.employee.last_name}` : 'Unassigned'}</span>
                    {task.deadline && (
                      <span>Due: {new Date(task.deadline).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={task.assigned_to || ''}
                    onChange={(e) => reassignTask(task.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Reassign...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onEdit(task)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DailyTaskLogProps {
  templates: TaskTemplate[];
  employees: Employee[];
  onRefresh: () => void;
}

function DailyTaskLog({ templates, employees, onRefresh }: DailyTaskLogProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const generateDailyTasks = () => {
    try {
      const dailyTemplates = templates.filter(t => t.is_daily);

      const tasks = dailyTemplates.map((template) => ({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        task_number: 'TASK-' + Date.now(),
        title: template.title,
        description: template.description,
        assigned_to: template.assigned_to,
        assigned_by: 'System',
        priority: template.priority,
        status: 'pending',
        is_daily_task: true,
        task_date: selectedDate,
        deadline: new Date(new Date(selectedDate).setHours(23, 59, 59)).toISOString(),
        created_at: new Date().toISOString()
      }));

      const existing = lsGet<any>('pos_tasks');
      lsSet('pos_tasks', [...existing, ...tasks]);

      alert(`Generated ${tasks.length} daily tasks for ${selectedDate}`);
      onRefresh();
    } catch (error) {
      console.error('Error generating daily tasks:', error);
      alert('Failed to generate daily tasks');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Calendar className="w-6 h-6 text-blue-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={generateDailyTasks}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Generate Daily Tasks
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Active Daily Task Templates</h3>
          {templates.filter(t => t.is_daily).map((template) => (
            <div key={template.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{template.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Assigned to: {template.employee ? `${template.employee.first_name} ${template.employee.last_name}` : 'Not assigned'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                  {template.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TaskReportsProps {
  tasks: Task[];
  employees: Employee[];
  stats: any;
}

function TaskReports({ tasks, employees, stats }: TaskReportsProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.task_date === today);
  const todayCompleted = todayTasks.filter(t => t.status === 'completed').length;
  const todayPending = todayTasks.filter(t => t.status !== 'completed').length;

  const exportReport = () => {
    const csvContent = [
      ['Task Number', 'Title', 'Assigned To', 'Priority', 'Status', 'Deadline', 'Created'],
      ...tasks.map(t => [
        t.task_number,
        t.title,
        t.employee ? `${t.employee.first_name} ${t.employee.last_name}` : 'Unassigned',
        t.priority,
        t.status,
        t.deadline || 'No deadline',
        new Date(t.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Daily Task Summary</h2>
          <button
            onClick={exportReport}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-xl p-6">
            <p className="text-sm text-blue-600 mb-2">Today's Tasks</p>
            <p className="text-3xl font-bold text-blue-900">{todayTasks.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-6">
            <p className="text-sm text-green-600 mb-2">Completed Today</p>
            <p className="text-3xl font-bold text-green-900">{todayCompleted}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6">
            <p className="text-sm text-yellow-600 mb-2">Pending Today</p>
            <p className="text-3xl font-bold text-yellow-900">{todayPending}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Employee Performance</h3>
          {employees.map((employee) => {
            const employeeTasks = tasks.filter(t => t.assigned_to === employee.id);
            const completed = employeeTasks.filter(t => t.status === 'completed').length;
            const total = employeeTasks.length;
            const completionRate = total > 0 ? ((completed / total) * 100).toFixed(0) : 0;

            return (
              <div key={employee.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{employee.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completionRate}%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{completed}/{total} completed</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface TaskModalProps {
  task: Task | null;
  employees: Employee[];
  onClose: () => void;
  onSave: () => void;
  currentUser: any;
}

function TaskModal({ task, employees, onClose, onSave, currentUser }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assigned_to: task?.assigned_to || '',
    priority: task?.priority || 'medium',
    deadline: task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
    is_daily_task: task?.is_daily_task || false
  });
  const [steps, setSteps] = useState<Array<{description: string, is_completed: boolean}>>([]);
  const [newStep, setNewStep] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'steps' | 'comments' | 'attachments'>('details');

  useEffect(() => {
    if (task) {
      fetchTaskData();
    }
  }, [task]);

  const fetchTaskData = () => {
    if (!task) return;

    const allSteps = lsGet<TaskStep>('pos_task_steps').filter(s => s.task_id === task.id);
    const allComments = lsGet<TaskComment>('pos_task_comments').filter(c => c.task_id === task.id);
    const allAttachments = lsGet<TaskAttachment>('pos_task_attachments').filter(a => a.task_id === task.id);

    setSteps(allSteps.sort((a, b) => (a.step_number || 0) - (b.step_number || 0)));
    setComments(allComments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    setAttachments(allAttachments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const taskData: any = {
        title: formData.title,
        description: formData.description || null,
        assigned_to: formData.assigned_to || null,
        priority: formData.priority,
        deadline: formData.deadline || null,
        assigned_by: currentUser?.email || 'Manager',
        is_daily_task: formData.is_daily_task
      };

      let taskId = task?.id;

      if (task) {
        const allTasks = lsGet<any>('pos_tasks');
        lsSet('pos_tasks', allTasks.map(t => t.id === task.id ? { ...t, ...taskData } : t));
      } else {
        taskId = Date.now().toString();
        taskData.id = taskId;
        taskData.task_number = 'TASK-' + Date.now();
        taskData.status = 'pending';
        taskData.task_date = formData.is_daily_task ? new Date().toISOString().split('T')[0] : null;
        taskData.created_at = new Date().toISOString();

        lsAppend('pos_tasks', taskData);

        if (steps.length > 0) {
          const stepsData = steps.map((step, index) => ({
            id: Date.now().toString() + index,
            task_id: taskId,
            step_number: index + 1,
            description: step.description,
            is_completed: false,
            created_at: new Date().toISOString()
          }));
          const existingSteps = lsGet<any>('pos_task_steps');
          lsSet('pos_task_steps', [...existingSteps, ...stepsData]);
        }
      }

      alert(task ? 'Task updated successfully' : 'Task created successfully');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving task:', error);
      alert(`Failed to save task: ${error.message || JSON.stringify(error)}`);
    }
  };

  const addStep = () => {
    if (newStep.trim()) {
      setSteps([...steps, { description: newStep, is_completed: false }]);
      setNewStep('');
    }
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const addComment = () => {
    if (!newComment.trim() || !task) return;

    try {
      lsAppend('pos_task_comments', {
        id: Date.now().toString(),
        task_id: task.id,
        comment: newComment,
        created_by: currentUser?.email || 'User',
        created_at: new Date().toISOString()
      });
      setNewComment('');
      fetchTaskData();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    alert('Image upload feature requires storage configuration. For now, showing simulated upload.');

    const simulatedUrl = URL.createObjectURL(file);
    try {
      lsAppend('pos_task_attachments', {
        id: Date.now().toString(),
        task_id: task.id,
        file_name: file.name,
        file_url: simulatedUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: currentUser?.email || 'User',
        created_at: new Date().toISOString()
      });
      fetchTaskData();
    } catch (error) {
      console.error('Error uploading attachment:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex space-x-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('steps')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'steps' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Steps ({steps.length})</span>
            </button>
            {task && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'comments' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Comments ({comments.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('attachments')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${activeTab === 'attachments' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  <Image className="w-4 h-4" />
                  <span>Attachments ({attachments.length})</span>
                </button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_daily_task"
                    checked={formData.is_daily_task}
                    onChange={(e) => setFormData({ ...formData, is_daily_task: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is_daily_task" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    This is a daily recurring task
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign To
                    </label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'steps' && (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newStep}
                    onChange={(e) => setNewStep(e.target.value)}
                    placeholder="Add a step..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                  />
                  <button
                    type="button"
                    onClick={addStep}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add Step
                  </button>
                </div>

                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 font-medium">{index + 1}.</span>
                      <span className="flex-1">{step.description}</span>
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {steps.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No steps added yet. Add steps to create a checklist for this task.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'comments' && task && (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addComment())}
                  />
                  <button
                    type="button"
                    onClick={addComment}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{comment.created_by}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{comment.comment}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No comments yet. Start the conversation!</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'attachments' && task && (
              <div className="space-y-4">
                <div>
                  <label className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                      <Image className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">Click to upload an image</p>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="border rounded-lg p-4">
                      {attachment.file_type.startsWith('image/') && (
                        <img
                          src={attachment.file_url}
                          alt={attachment.file_name}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                      <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                      <p className="text-xs text-gray-500">{attachment.uploaded_by}</p>
                    </div>
                  ))}
                  {attachments.length === 0 && (
                    <div className="col-span-2 text-gray-500 text-center py-8">
                      No attachments yet. Upload images to document task progress.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center space-x-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
