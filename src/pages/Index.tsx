import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate, isLoggedIn]);

  return null;
};

export default Index;
