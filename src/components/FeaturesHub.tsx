import React from 'react';
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  CheckCircle,
  BarChart3,
  DollarSign,
  Camera,
  Monitor,
  ClipboardList,
  UserCheck,
  Truck,
  UserPlus,
  Settings,
  UtensilsCrossed,
  TrendingUp
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface FeatureCard {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  roles: string[];
}

const features: FeatureCard[] = [
  { id: 'dashboard',        label: 'Dashboard',        description: 'Overview & stats',       icon: LayoutDashboard, color: 'blue',   roles: ['admin','manager','cashier','staff'] },
  { id: 'inventory',        label: 'Inventory',        description: 'Stock & items',          icon: Package,         color: 'green',  roles: ['admin','manager','staff'] },
  { id: 'procurement',      label: 'Procurement',      description: 'Purchase orders & PRs',  icon: FileText,        color: 'orange', roles: ['admin','manager'] },
  { id: 'approvals',        label: 'Approvals',        description: 'Approve requests',       icon: CheckCircle,     color: 'teal',   roles: ['admin','manager'] },
  { id: 'reports',          label: 'Reports',          description: 'Sales & analytics',      icon: BarChart3,       color: 'purple', roles: ['admin','manager'] },
  { id: 'finance',          label: 'Finance',          description: 'Cash & P&L',             icon: DollarSign,      color: 'emerald',roles: ['admin','manager'] },
  { id: 'client-relations', label: 'Clients',          description: 'CRM & loyalty',          icon: UserPlus,        color: 'pink',   roles: ['admin','manager','cashier'] },
  { id: 'suppliers',        label: 'Suppliers',        description: 'Vendor management',      icon: Truck,           color: 'yellow', roles: ['admin','manager'] },
  { id: 'task-management',  label: 'Tasks',            description: 'Team task tracking',     icon: ClipboardList,   color: 'indigo', roles: ['admin','manager','staff'] },
  { id: 'users',            label: 'Users',            description: 'Manage accounts',        icon: Users,           color: 'red',    roles: ['admin'] },
  { id: 'hr-management',    label: 'HR',               description: 'Staff & payroll',        icon: UserCheck,       color: 'cyan',   roles: ['admin','hr_admin'] },
  { id: 'cameras',          label: 'Cameras',          description: 'CCTV monitoring',        icon: Camera,          color: 'slate',  roles: ['admin','manager'] },
  { id: 'menu-screens',     label: 'Menu Screens',     description: 'Digital displays',       icon: Monitor,         color: 'violet', roles: ['admin','manager'] },
  { id: 'combo-management', label: 'Combos',           description: 'Combo meals & bundles',  icon: UtensilsCrossed, color: 'amber',  roles: ['admin','manager'] },
  { id: 'combo-profit',     label: 'Combo Reports',    description: 'Combo profitability',    icon: TrendingUp,      color: 'lime',   roles: ['admin','manager'] },
  { id: 'settings',         label: 'Settings',         description: 'System configuration',   icon: Settings,        color: 'gray',   roles: ['admin','manager'] },
];

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',    icon: 'text-blue-600 dark:text-blue-400',    border: 'border-blue-100 dark:border-blue-800' },
  green:   { bg: 'bg-green-50 dark:bg-green-900/20',  icon: 'text-green-600 dark:text-green-400',  border: 'border-green-100 dark:border-green-800' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-900/20',icon: 'text-orange-600 dark:text-orange-400',border: 'border-orange-100 dark:border-orange-800' },
  teal:    { bg: 'bg-teal-50 dark:bg-teal-900/20',    icon: 'text-teal-600 dark:text-teal-400',    border: 'border-teal-100 dark:border-teal-800' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20',icon: 'text-purple-600 dark:text-purple-400',border: 'border-purple-100 dark:border-purple-800' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20',icon:'text-emerald-600 dark:text-emerald-400',border:'border-emerald-100 dark:border-emerald-800'},
  pink:    { bg: 'bg-pink-50 dark:bg-pink-900/20',    icon: 'text-pink-600 dark:text-pink-400',    border: 'border-pink-100 dark:border-pink-800' },
  yellow:  { bg: 'bg-yellow-50 dark:bg-yellow-900/20',icon: 'text-yellow-600 dark:text-yellow-400',border: 'border-yellow-100 dark:border-yellow-800' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/20',icon: 'text-indigo-600 dark:text-indigo-400',border: 'border-indigo-100 dark:border-indigo-800' },
  red:     { bg: 'bg-red-50 dark:bg-red-900/20',      icon: 'text-red-600 dark:text-red-400',      border: 'border-red-100 dark:border-red-800' },
  cyan:    { bg: 'bg-cyan-50 dark:bg-cyan-900/20',    icon: 'text-cyan-600 dark:text-cyan-400',    border: 'border-cyan-100 dark:border-cyan-800' },
  slate:   { bg: 'bg-slate-50 dark:bg-slate-900/20',  icon: 'text-slate-600 dark:text-slate-400',  border: 'border-slate-100 dark:border-slate-800' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-900/20',icon: 'text-violet-600 dark:text-violet-400',border: 'border-violet-100 dark:border-violet-800' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',  icon: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-100 dark:border-amber-800' },
  lime:    { bg: 'bg-lime-50 dark:bg-lime-900/20',    icon: 'text-lime-600 dark:text-lime-400',    border: 'border-lime-100 dark:border-lime-800' },
  gray:    { bg: 'bg-gray-50 dark:bg-gray-800',       icon: 'text-gray-600 dark:text-gray-400',    border: 'border-gray-100 dark:border-gray-700' },
};

interface FeaturesHubProps {
  onNavigate: (item: string) => void;
}

export default function FeaturesHub({ onNavigate }: FeaturesHubProps) {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  const visible = features.filter(f => user && f.roles.includes(user.role));

  return (
    <div className={`min-h-full p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <h2 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Features
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {visible.map((feature) => {
          const Icon = feature.icon;
          const colors = colorMap[feature.color] || colorMap.gray;
          return (
            <button
              key={feature.id}
              onClick={() => onNavigate(feature.id)}
              className={`flex flex-col items-start p-4 rounded-xl border transition-all hover:shadow-md active:scale-95 text-left ${colors.bg} ${colors.border}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {feature.label}
              </p>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {feature.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
