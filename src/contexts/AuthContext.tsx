import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // During development: no authentication required
  // Auto-login with first active user

  useEffect(() => {
    autoLogin();
  }, []);

  const autoLogin = async () => {
    try {
      setIsLoading(true);
      
      // جلب أول حساب نشط تلقائياً
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Error fetching first user:', error);
        // في حالة الخطأ، نستخدم مستخدم افتراضي
      }

      if (data && data.length > 0) {
        const firstUser = data[0];
        setUser({
          id: firstUser.id,
          email: firstUser.email,
          username: firstUser.username || firstUser.email,
          role: firstUser.role,
          isActive: firstUser.is_active !== false,
          first_name: firstUser.first_name,
          last_name: firstUser.last_name,
        });
      } else {
        // إذا لم يتم العثور على مستخدمين، نستخدم مستخدم افتراضي للوصول المباشر
        setUser({
          id: 'dev-user-default',
          email: 'admin@pos.local',
          username: 'مدير النظام',
          role: 'admin',
          isActive: true,
          first_name: 'مدير',
          last_name: 'النظام',
        });
      }
    } catch (error) {
      console.error('Error in auto-login:', error);
      // في حالة الخطأ، نستخدم مستخدم افتراضي
      setUser({
        id: 'dev-user-default',
        email: 'admin@pos.local',
        username: 'مدير النظام',
        role: 'admin',
        isActive: true,
        first_name: 'مدير',
        last_name: 'النظام',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for ID:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('User not found');
      }

      console.log('User data fetched:', data);

      const userData = {
        id: data.id,
        email: data.email,
        username: data.username || data.email,
        role: data.role,
        isActive: data.is_active !== false,
        first_name: data.first_name,
        last_name: data.last_name,
      };

      console.log('Setting user:', userData);
      setUser(userData);
      
      return userData;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      throw error;
    }
  };

  const switchUser = async (userId: string) => {
    try {
      setIsLoading(true);
      console.log('Switching to user:', userId);
      const userData = await fetchUserProfile(userId);
      console.log('Successfully switched to user:', userData);
    } catch (error: any) {
      console.error('Error switching user:', error);
      const errorMessage = error?.message || 'Unknown error';
      alert(`Failed to switch user: ${errorMessage}\n\nPlease check console for details.`);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Deprecated in dev mode - use switchUser instead
    console.warn('Login function is disabled in development mode. Use switchUser instead.');
    return false;
  };

  const signup = async (email: string, password: string, username: string): Promise<boolean> => {
    // Deprecated in dev mode
    console.warn('Signup function is disabled in development mode.');
    return false;
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, switchUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
