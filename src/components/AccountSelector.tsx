import React, { useState, useEffect } from 'react';
import { User, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../lib/supabase';

interface UserOption {
  id: string;
  email: string;
  username: string;
  role: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
}

export default function AccountSelector() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { switchUser } = useAuth();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const search = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search) ||
            user.first_name?.toLowerCase().includes(search) ||
            user.last_name?.toLowerCase().includes(search) ||
            user.role?.toLowerCase().includes(search)
        )
      );
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // أولاً، نجرب جلب جميع الحسابات (بما في ذلك غير النشطة) للتشخيص
      const { data: allUsers, error: allError } = await supabase
        .from('users')
        .select('id, email, username, role, first_name, last_name, is_active');

      if (allError) {
        console.error('Error fetching all users:', allError);
        throw allError;
      }

      console.log('All users from DB:', allUsers);
      console.log('Total users found:', allUsers?.length || 0);

      // ثم نفلتر فقط النشطة
      const activeUsers = (allUsers || []).filter(
        (user) => user.is_active === true || user.is_active === null
      );

      console.log('Active users:', activeUsers);
      console.log('Active users count:', activeUsers.length);

      // ترتيب حسب الاسم أو البريد الإلكتروني
      const sortedUsers = activeUsers.sort((a, b) => {
        const nameA = (a.first_name || a.username || a.email || '').toLowerCase();
        const nameB = (b.first_name || b.username || b.email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);

      if (sortedUsers.length === 0 && (allUsers?.length || 0) > 0) {
        console.warn('No active users found, but total users exist');
        alert(
          `تم العثور على ${allUsers?.length || 0} حساب في قاعدة البيانات، لكن لا يوجد حسابات نشطة.\n` +
          `يرجى التحقق من أن الحسابات لديها is_active = true`
        );
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      const errorMessage = error?.message || 'خطأ غير معروف';
      alert(`فشل تحميل المستخدمين: ${errorMessage}\n\nيرجى التحقق من:\n1. تطبيق migration للـ RLS\n2. الاتصال بقاعدة البيانات`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: UserOption) => {
    await switchUser(user.id);
  };

  const getDisplayName = (user: UserOption) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    if (user.username) {
      return user.username;
    }
    return user.email;
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      admin: 'مدير',
      manager: 'مدير قسم',
      employee: 'موظف',
      cashier: 'كاشير',
      hr_admin: 'مدير موارد بشرية',
      staff: 'موظف',
    };
    return roleLabels[role] || role;
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900 to-gray-800'
          : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}
    >
      <div
        className={`max-w-2xl w-full rounded-2xl shadow-xl p-8 transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-800'
        }`}
      >
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">POS</span>
          </div>
          <h1
            className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            اختر حساب
          </h1>
          <p
            className={`mt-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            اختر الحساب للدخول إلى النظام
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن حساب..."
              className={`w-full pr-10 pl-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p
              className={`mt-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              جاري التحميل...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div
            className={`text-center py-12 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <p className="mb-2">لا توجد حسابات متاحة</p>
            <p className="text-sm mt-2 opacity-75">
              {searchTerm
                ? 'لم يتم العثور على حسابات تطابق البحث'
                : 'يرجى التحقق من أن الحسابات في قاعدة البيانات نشطة (is_active = true)'}
            </p>
            <button
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white'
                    : 'bg-white border-gray-200 hover:bg-blue-50 text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-gray-600' : 'bg-blue-100'
                    }`}
                  >
                    <User
                      className={`w-6 h-6 ${
                        isDarkMode ? 'text-gray-300' : 'text-blue-600'
                      }`}
                    />
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{getDisplayName(user)}</p>
                    <p
                      className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {user.email}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      {getRoleLabel(user.role)}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

