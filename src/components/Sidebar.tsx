import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  CheckCircle,
  Globe,
  BarChart3,
  Palette,
  Monitor,
  Camera,
  DollarSign,
  Delete,
  UserPlus,
  ClipboardList,
  UserCheck,
  Truck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { MenuItem } from '../types';

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    roles: ['admin', 'manager', 'cashier', 'staff']
  },
  {
    id: 'pos',
    label: 'POS',
    icon: 'ShoppingCart',
    path: '/pos',
    roles: ['admin', 'manager', 'cashier']
  },
  {
    id: 'client-relations',
    label: 'Client Relations',
    icon: 'UserPlus',
    path: '/client-relations',
    roles: ['admin', 'manager', 'cashier']
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'Package',
    path: '/inventory',
    roles: ['admin', 'manager', 'staff']
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: 'FileText',
    path: '/procurement',
    roles: ['admin', 'manager']
  },
  {
    id: 'pr-status',
    label: 'PR Status',
    icon: 'FileText',
    path: '/pr-status',
    roles: ['admin', 'manager']
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: 'Truck',
    path: '/suppliers',
    roles: ['admin', 'manager']
  },
  {
    id: 'task-management',
    label: 'Task Management',
    icon: 'ClipboardList',
    path: '/task-management',
    roles: ['admin', 'manager', 'staff']
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'Users',
    path: '/users',
    roles: ['admin']
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: 'CheckCircle',
    path: '/approvals',
    roles: ['admin', 'manager']
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'BarChart3',
    path: '/reports',
    roles: ['admin', 'manager']
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'DollarSign',
    path: '/finance',
    roles: ['admin', 'manager']
  },
  {
    id: 'cameras',
    label: 'Cameras',
    icon: 'Camera',
    path: '/cameras',
    roles: ['admin', 'manager']
  },
  {
    id: 'menu-screens',
    label: 'Menu Screens',
    icon: 'Monitor',
    path: '/menu-screens',
    roles: ['admin', 'manager']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    path: '/settings',
    roles: ['admin', 'manager']
  },
  {
    id: 'hr-management',
    label: 'HR',
    icon: 'UserCheck',
    path: '/hr-management',
    roles: ['admin', 'hr_admin']
  }
];

const iconMap = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  UserCheck,
  CheckCircle,
  BarChart3,
  Camera,
  Monitor,
  DollarSign,
  Settings,
  UserPlus,
  ClipboardList,
  Truck
};

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

export default function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();

  const isPosActive = false;
  const sidebarHeightClass = 'h-16';

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className={`w-full ${sidebarHeightClass} border-t transition-all duration-300 ease-in-out ${
      isDarkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200 dark:border-gray-700'
    }`}>
      <nav className="h-full">
        <ul className="flex h-full">
          {filteredMenuItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive = activeItem === item.id;
            
            return (
              <li key={item.id} className="flex-1">
                <button
                  onClick={() => onItemClick(item.id)}
                  className={`w-full h-full flex flex-col items-center justify-center space-y-1 transition-all ${
                    isActive
                      ? isDarkMode 
                        ? 'bg-blue-900 text-blue-400' 
                        : 'bg-blue-50 text-blue-700'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    isActive 
                      ? isDarkMode ? 'text-blue-400' : 'text-blue-700'
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className="font-medium text-xs">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}