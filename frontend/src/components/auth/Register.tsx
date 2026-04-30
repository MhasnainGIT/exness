import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchApi } from '../../lib/api';

export function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    country: 'United States',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      login(data);
      navigate('/accounts');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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

      <main className="flex-1 flex flex-col items-center pt-12 px-6">
        <h1 className="text-[32px] font-bold text-[#212529] mb-8">Welcome to Exness</h1>

        <div className="w-full max-w-[440px]">
          {/* Tabs */}
          <div className="flex border-b border-[#E9ECEF] mb-8">
            <Link to="/login" className="flex-1 pb-4 text-sm font-semibold text-[#848e9c] hover:text-black transition-all text-center">
              Sign in
            </Link>
            <button className="flex-1 pb-4 text-sm font-semibold text-black border-b-2 border-black transition-all">
              Create an account
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[#5f6368]">First name</label>
                <input
                  type="text" name="firstName" required
                  value={formData.firstName} onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-[#CED4DA] rounded-lg focus:border-black outline-none transition-all text-black"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[#5f6368]">Last name</label>
                <input
                  type="text" name="lastName" required
                  value={formData.lastName} onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-[#CED4DA] rounded-lg focus:border-black outline-none transition-all text-black"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#5f6368]">Your email address</label>
              <input
                type="email" name="email" required
                value={formData.email} onChange={handleChange}
                className="w-full h-[48px] px-4 border border-[#CED4DA] rounded-lg focus:border-black outline-none transition-all text-black"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#5f6368]">Create a password</label>
              <input
                type="password" name="password" required
                value={formData.password} onChange={handleChange}
                className="w-full h-[48px] px-4 border border-[#CED4DA] rounded-lg focus:border-black outline-none transition-all text-black"
              />
            </div>

            {error && <p className="text-[#D6344D] text-[13px]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-[#FFD700] hover:bg-[#F2CC00] text-black font-semibold rounded-lg transition-colors mt-4"
            >
              {loading ? 'Creating account...' : 'Create an account'}
            </button>

            <div className="text-center pt-4 text-[13px] text-[#848e9c]">
              By registering, you agree to our <button type="button" className="text-[#007BFF] font-medium hover:underline">Terms of Service</button>
            </div>
          </form>
        </div>
      </main>

      <footer className="mt-16 px-6 pb-12 max-w-[1200px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] leading-relaxed text-[#848e9c]">
        <div className="space-y-4">
          <p>Vanvest Limited is registered and regulated by the Financial Services Commission of the Republic of Vanuatu under registration number 700276 and has its registered office at Law Partners House, Kumul Highway, Port Vila, Vanuatu.</p>
          <p>Risk Warning: Online Forex/CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage.</p>
        </div>
        <div className="flex flex-col md:items-end gap-2">
          <p>© 2008-2026 Exness</p>
        </div>
      </footer>
    </div>
  );
}
