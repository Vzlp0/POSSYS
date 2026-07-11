import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import AccountSelector from './components/AccountSelector';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import HRManagement from './components/HRManagement';
import ComingSoon from './components/ComingSoon';
import Procurement from './components/Procurement';
import ManagerApproval from './components/ManagerApproval';
import PRStatusDashboard from './components/PRStatusDashboard';
import POStatusDashboard from './components/POStatusDashboard';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import MenuScreensHub from './components/MenuScreensHub';
import MenuAdmin from './components/MenuAdmin';
import MenuScreensDashboard from './components/MenuScreensDashboard';
import TemplateDesigner from './components/TemplateDesigner';
import ScreensManager from './components/ScreensManager';
import Player from './components/Player';
import CameraOverview from './components/CameraOverview';
import CameraEventViewer from './components/CameraEventViewer';
import CameraLiveView from './components/CameraLiveView';
import CameraPlayback from './components/CameraPlayback';
import CameraDevices from './components/CameraDevices';
import CameraSettings from './components/CameraSettings';
import Finance from './components/Finance';
import ClientRelations from './components/ClientRelations';
import TaskManagement from './components/TaskManagement';
import SupplierManagement from './components/SupplierManagement';
import ComboManagement from './components/ComboManagement';
import ComboProfitReport from './components/ComboProfitReport';
import FeaturesHub from './components/FeaturesHub';
import ThemeToggle from './components/ThemeToggle';
import { LogOut, User, ChevronDown, Users } from 'lucide-react';

function AppContent() {
  const { user, logout, switchUser, isLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const [activeItem, setActiveItem] = useState('hub');
  const [menuScreensPage, setMenuScreensPage] = useState<'dashboard' | 'menu-admin' | 'template-designer' | 'screens-manager' | 'player'>('dashboard');
  const [cameraPage, setCameraPage] = useState<'overview' | 'event-viewer' | 'live-view' | 'playback' | 'devices' | 'settings'>('overview');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // عرض شاشة التحميل أثناء تسجيل الدخول التلقائي
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // لا نعرض شاشة اختيار الحساب أبداً - نعرض الصفحة الرئيسية مباشرة
  // إذا لم يكن هناك user (يجب ألا يحدث)، نستخدم مستخدم افتراضي
  const currentUser = user || {
    id: 'dev-user-default',
    email: 'admin@pos.local',
    username: 'مدير النظام',
    role: 'admin',
    isActive: true,
    first_name: 'مدير',
    last_name: 'النظام',
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSwitchAccount = async () => {
    await logout();
  };

  const getDisplayName = () => {
    if (currentUser.first_name && currentUser.last_name) {
      return `${currentUser.first_name} ${currentUser.last_name}`;
    }
    return currentUser.username || currentUser.email;
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'hub':
        return <FeaturesHub onNavigate={setActiveItem} />;
      case 'dashboard':
        return <Dashboard setActiveItem={setActiveItem} />;
      case 'users':
        return <UserManagement />;
      case 'hr-management':
        return <HRManagement />;
      case 'pos':
        return (
          <ComingSoon
            title="Point of Sale"
            description="Complete POS system with product scanning, payment processing, and receipt generation."
          />
        );
      case 'inventory':
        return <Inventory />;
      case 'procurement':
        return <Procurement setActiveItem={setActiveItem} />;
      case 'pr-status':
        return <PRStatusDashboard onBack={() => setActiveItem('dashboard')} setActiveItem={setActiveItem} />;
      case 'po-status':
        return <POStatusDashboard onBack={() => setActiveItem('dashboard')} setActiveItem={setActiveItem} />;
      case 'approvals':
        return <ManagerApproval />;
      case 'reports':
        return <Reports />;
      case 'finance':
        return <Finance />;
      case 'client-relations':
        return <ClientRelations />;
      case 'task-management':
        return <TaskManagement />;
      case 'suppliers':
        return <SupplierManagement onBack={() => setActiveItem('procurement')} />;
      case 'combo-management':
        return <ComboManagement onBack={() => setActiveItem('inventory')} />;
      case 'combo-profit':
        return <ComboProfitReport onBack={() => setActiveItem('reports')} />;
      case 'cameras':
        switch (cameraPage) {
          case 'overview':
            return <CameraOverview onNavigate={setCameraPage} />;
          case 'event-viewer':
            return <CameraEventViewer onBack={() => setCameraPage('overview')} />;
          case 'live-view':
            return <CameraLiveView onBack={() => setCameraPage('overview')} />;
          case 'playback':
            return <CameraPlayback onBack={() => setCameraPage('overview')} />;
          case 'devices':
            return <CameraDevices onBack={() => setCameraPage('overview')} />;
          case 'settings':
            return <CameraSettings onBack={() => setCameraPage('overview')} />;
          default:
            return <CameraOverview onNavigate={setCameraPage} />;
        }
      case 'menu-screens':
        switch (menuScreensPage) {
          case 'dashboard':
            return <MenuScreensDashboard onNavigate={setMenuScreensPage} />;
          case 'menu-admin':
            return <MenuAdmin onBack={() => setMenuScreensPage('dashboard')} />;
          case 'template-designer':
            return <TemplateDesigner onBack={() => setMenuScreensPage('dashboard')} />;
          case 'screens-manager':
            return <ScreensManager onBack={() => setMenuScreensPage('dashboard')} />;
          case 'player':
            return <Player />;
          default:
            return <MenuScreensDashboard onNavigate={setMenuScreensPage} />;
        }
      case 'settings':
        return (
          <ComingSoon
            title="System Settings"
            description="Configure system preferences, integrations, and business settings."
          />
        );
      default:
        return <FeaturesHub onNavigate={setActiveItem} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with User Menu */}
      <header className={`flex items-center justify-between px-6 py-3 border-b ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">POS System</h1>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">{getDisplayName()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser.role}</p>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-20 ${
                  isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  <div className={`px-4 py-3 border-b ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{getDisplayName()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-1">Role: {currentUser.role}</p>
                  </div>

                  <button
                    onClick={handleSwitchAccount}
                    className={`w-full flex items-center space-x-2 px-4 py-3 text-left transition-colors ${
                      isDarkMode
                        ? 'hover:bg-gray-700 text-blue-400'
                        : 'hover:bg-gray-50 text-blue-600'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>تبديل الحساب</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center space-x-2 px-4 py-3 text-left transition-colors ${
                      isDarkMode
                        ? 'hover:bg-gray-700 text-red-400'
                        : 'hover:bg-gray-50 text-red-600'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}