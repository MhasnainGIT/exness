import React from 'react';
import { useNavigate } from 'react-router-dom';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center font-sans">
      <div className="flex-1 flex flex-col items-center justify-center max-w-[800px] w-full px-6">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center font-bold text-[14px]">ex</div>
          <span className="text-[32px] font-bold tracking-tighter text-black">exness</span>
        </div>

        <p className="text-[#5f6368] text-[15px] mb-12">
          Please sign in or register for full access to Exness content and services.
        </p>

        <div className="w-full max-w-[340px] space-y-3">
          <button 
            onClick={() => navigate('/login')}
            className="w-full h-[52px] bg-[#FFD700] hover:bg-[#F2CC00] text-black font-semibold text-[15px] rounded-lg transition-colors"
          >
            Sign in
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="w-full h-[52px] bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#212529] font-semibold text-[15px] rounded-lg transition-colors"
          >
            Register
          </button>
        </div>

        <div className="mt-12">
          <a href="mailto:support@exness.com" className="text-black text-sm border-b border-black pb-0.5 hover:opacity-70 transition-opacity">
            support@exness.com
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full border-t border-[#E9ECEF] py-8 flex flex-col items-center">
        <p className="text-[#848e9c] text-[11px] max-w-[800px] text-center leading-relaxed">
          Vanvest Limited is registered and regulated by the Financial Services Commission of the Republic of Vanuatu under registration number 700276.
        </p>
      </div>
    </div>
  );
}
