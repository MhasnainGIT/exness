import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchApi } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('demo.trader@trading.local');
  const [password, setPassword] = useState('Trader@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] flex flex-col font-sans selection:bg-[#ffce00]/30">
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Logo Section */}
          <div className="mb-10 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-black text-[32px] tracking-tighter text-[#ffce00] lowercase">exness</span>
            </div>
            <p className="text-[#848e9c] text-sm font-medium">Log in to your Personal Area</p>
          </div>

          <div className="bg-[#16181d] border border-[#2b2f36] rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ffce00] to-transparent opacity-50"></div>
            
            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label className="text-[12px] font-black uppercase tracking-widest text-[#5f6368] ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-[#ffce00]">
                    <Mail className="h-4 w-4 text-[#5f6368]" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-[#0c0d10] border border-[#2b2f36] rounded-xl text-white text-sm placeholder:text-[#5f6368] outline-none transition-all focus:border-[#ffce00]/50 focus:ring-4 focus:ring-[#ffce00]/5"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[12px] font-black uppercase tracking-widest text-[#5f6368]">Password</label>
                  <button type="button" className="text-[11px] font-bold text-[#ffce00] hover:underline">Forgot?</button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-[#ffce00]">
                    <Lock className="h-4 w-4 text-[#5f6368]" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-[#0c0d10] border border-[#2b2f36] rounded-xl text-white text-sm placeholder:text-[#5f6368] outline-none transition-all focus:border-[#ffce00]/50 focus:ring-4 focus:ring-[#ffce00]/5"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-[#d6344d]/10 border border-[#d6344d]/20 rounded-lg p-3 flex items-start gap-2 animate-in fade-in zoom-in duration-200">
                  <span className="text-[#d6344d] text-xs font-semibold leading-relaxed">{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 bg-[#ffce00] hover:bg-[#e6bb00] text-black font-black uppercase tracking-widest text-[13px] rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-[#ffce00]/10 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : 'Continue'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>

              <div className="pt-2 text-center">
                <p className="text-[13px] text-[#848e9c]">
                  New to Exness? <Link to="/register" className="text-[#ffce00] font-black hover:underline transition-all">Create an account</Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer Info */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[#5f6368]">
             <ShieldCheck className="h-3.5 w-3.5" />
             <span className="text-[11px] font-bold uppercase tracking-wider">Secure SSL Encryption</span>
          </div>
        </div>
      </div>
      
      {/* Visual background element */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ffce00]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-[#1e75e4]/5 blur-[100px] rounded-full pointer-events-none"></div>
    </div>
  );
}
