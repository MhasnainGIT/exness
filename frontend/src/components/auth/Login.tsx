import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchApi } from '../../lib/api';

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
      navigate('/accounts');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="h-[64px] border-b border-[#E9ECEF] flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#FFD700] rounded flex items-center justify-center font-bold text-[10px]">ex</div>
          <span className="text-xl font-bold tracking-tight text-black">exness</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-16 px-6">
        <h1 className="text-[32px] font-bold text-[#212529] mb-8">Welcome to Exness</h1>

        <div className="w-full max-w-[440px]">
          {/* Tabs */}
          <div className="flex border-b border-[#E9ECEF] mb-8">
            <button className="flex-1 pb-4 text-sm font-semibold text-black border-b-2 border-black transition-all">
              Sign in
            </button>
            <Link to="/register" className="flex-1 pb-4 text-sm font-semibold text-[#848e9c] hover:text-black transition-all text-center">
              Create an account
            </Link>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#5f6368]">Your email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[48px] px-4 border border-[#CED4DA] rounded-lg focus:border-black outline-none transition-all text-black"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#5f6368]">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[48px] px-4 border border-[#CED4DA] rounded-lg focus:border-black outline-none transition-all text-black"
              />
            </div>

            {error && <p className="text-[#D6344D] text-[13px]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-[#FFD700] hover:bg-[#F2CC00] text-black font-semibold rounded-lg transition-colors mt-4"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E9ECEF]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-[#848e9c] uppercase">Or sign in with</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full h-[48px] border border-[#CED4DA] rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H1.05545V12.9682C2.53545 15.9041 5.56364 18 9 18Z" fill="#34A853"/>
                <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V5.03182H1.05545C0.441818 6.22636 0 7.57636 0 9C0 10.4236 0.441818 11.7736 1.05545 12.9682L3.96409 10.71Z" fill="#FBBC05"/>
                <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.56364 0 2.53545 2.09591 1.05545 5.03182L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
              </svg>
              <span className="text-[15px] font-medium text-[#212529]">Google</span>
            </button>

            <div className="text-center pt-2">
              <button type="button" className="text-[#007BFF] text-[13px] hover:underline transition-all">
                I forgot my password
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer info from screenshot */}
      <footer className="mt-16 px-6 pb-12 max-w-[1200px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] leading-relaxed text-[#848e9c]">
        <div className="space-y-4">
          <p>Vanvest Limited is registered and regulated by the Financial Services Commission of the Republic of Vanuatu under registration number 700276 and has its registered office at Law Partners House, Kumul Highway, Port Vila, Vanuatu.</p>
          <p>This website is operated by Vanvest Limited.</p>
          <p>The entity above is duly authorized to operate under the Exness brand and trademarks.</p>
          <p>Risk Warning: Online Forex/CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money. Under no circumstances shall Exness have any liability to any person or entity for any loss or damage in whole or part caused by, resulting from, or relating to any financial activity.</p>
        </div>
        <div className="flex flex-col md:items-end gap-2">
          <a href="#" className="hover:text-black">Privacy Agreement</a>
          <a href="#" className="hover:text-black">Risk disclosure</a>
          <a href="#" className="hover:text-black">Preventing money laundering</a>
          <a href="#" className="hover:text-black">Security instructions</a>
          <a href="#" className="hover:text-black">Legal documents</a>
          <a href="#" className="hover:text-black">Complaints Handling Policy</a>
          <p className="mt-4">© 2008-2026 Exness</p>
        </div>
      </footer>
    </div>
  );
}
