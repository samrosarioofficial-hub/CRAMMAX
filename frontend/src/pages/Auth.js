import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/utils/api';
import { setToken, setUser } from '@/utils/auth';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await apiClient.post(endpoint, payload);
      const { token, user } = response.data;

      setToken(token);
      setUser(user);
      
      toast.success(isLogin ? 'Welcome back' : 'Account created');
      navigate('/home');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 text-zinc-400 hover:text-zinc-50 rounded-none"
          data-testid="back-to-landing-btn"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Auth Form */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-sm p-8 backdrop-blur-sm">
          <h1 className="font-heading font-black text-4xl uppercase tracking-tighter mb-2" data-testid="auth-title">
            {isLogin ? 'LOGIN' : 'SIGN UP'}
          </h1>
          <p className="text-zinc-400 text-sm mb-8">
            {isLogin ? 'Continue your discipline journey' : 'Start your transformation'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-zinc-300 text-xs uppercase tracking-wider">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none mt-2"
                  required={!isLogin}
                  data-testid="auth-name-input"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-zinc-300 text-xs uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none mt-2"
                required
                data-testid="auth-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-zinc-300 text-xs uppercase tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none mt-2"
                required
                data-testid="auth-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold py-5 shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100"
              data-testid="auth-submit-btn"
            >
              {loading ? 'PROCESSING...' : (isLogin ? 'LOGIN' : 'CREATE ACCOUNT')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-zinc-400 hover:text-zinc-50 text-sm transition-colors duration-100"
              data-testid="auth-toggle-btn"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
