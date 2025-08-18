import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  loginTime: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ตรวจสอบสถานะการ login เมื่อโหลดหน้า
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const username = localStorage.getItem('username');
      const loginTime = localStorage.getItem('loginTime');

      if (isLoggedIn && username && loginTime) {
        setUser({
          username,
          loginTime,
          role: 'admin' // กำหนด role เป็น admin สำหรับตอนนี้
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // จำลองการ login (ในอนาคตจะเชื่อมต่อกับ backend)
      if (username === 'admin' && password === 'admin123') {
        const userData = {
          username,
          loginTime: new Date().toISOString(),
          role: 'admin'
        };

        // บันทึกข้อมูลการ login
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('loginTime', userData.loginTime);

        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    // ลบข้อมูลการ login
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTime');
    
    setUser(null);
    
    // เปลี่ยนไปหน้า Login
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
