import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { fetchApi } from '../../lib/api';
import { useUi } from '../../contexts/UiContext';
import { Shield, User, Mail, Globe, Phone, Lock, Key, Eye, EyeOff } from 'lucide-react';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { showToast } = useUi();
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const requestKyc = async () => {
    setLoading(true);
    try {
      await fetchApi('/users/kyc', {
        method: 'POST',
        body: JSON.stringify({ documents: [{ type: 'passport', fileUrl: 'https://example.com/mock.jpg' }] })
      });
      showToast('KYC Verification request submitted successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-20">
      <h1 className="text-[26px] font-semibold text-[#1a1b20]">Personal information</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-[14px] font-semibold text-[#1a1b20] mb-5 pb-3 border-b border-gray-100">Personal Details</h2>
          <div className="space-y-4">
            <InfoRow icon={<User className="h-4 w-4" />} label="First Name" value={user?.firstName || 'Not set'} />
            <InfoRow icon={<User className="h-4 w-4" />} label="Last Name" value={user?.lastName || 'Not set'} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email || 'Not set'} />
            <InfoRow icon={<Globe className="h-4 w-4" />} label="Country" value={user?.country || 'Not set'} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user?.phone || 'Not set'} />
          </div>
        </div>

        {/* Verification Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
          <h2 className="text-[14px] font-semibold text-[#1a1b20] mb-5 pb-3 border-b border-gray-100">Verification (KYC)</h2>
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
            <div className="h-16 w-16 bg-[#f4f5f7] rounded-full flex items-center justify-center mb-4">
              <Shield className={`h-8 w-8 ${user?.kycStatus === 'VERIFIED' ? 'text-[#26a69a]' : 'text-[#8b8e94]'}`} />
            </div>
            <p className="text-[15px] font-semibold text-[#1a1b20]">
              {user?.kycStatus === 'VERIFIED' ? 'Account Verified' : 'Unverified Account'}
            </p>
            <p className="text-[13px] text-[#8b8e94] max-w-[280px] mt-1.5">
              {user?.kycStatus === 'VERIFIED'
                ? 'Your identity has been verified. You have full platform access.'
                : 'Complete verification to lift withdrawal limits and unlock all features.'}
            </p>
          </div>
          {user?.kycStatus !== 'VERIFIED' && (
            <Button
              onClick={requestKyc}
              disabled={loading}
              className="w-full bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] font-semibold h-[40px] text-[13px] mt-4"
            >
              {loading ? 'Submitting...' : 'Complete Verification'}
            </Button>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-[14px] font-semibold text-[#1a1b20] mb-5 pb-3 border-b border-gray-100">Security</h2>
        <div className="space-y-4">
          <SecurityRow
            icon={<Lock className="h-4 w-4" />}
            title="Change password"
            desc="Update your account password"
            onClick={() => setShowPasswordModal(true)}
          />
          <SecurityRow
            icon={<Key className="h-4 w-4" />}
            title="Two-factor authentication"
            desc="Add an extra layer of security to your account"
            onClick={() => setShowTwoFactorModal(true)}
            badge="Not enabled"
          />
          <SecurityRow
            icon={<Eye className="h-4 w-4" />}
            title="Login history"
            desc="View your recent login activity"
            onClick={() => setShowHistoryModal(true)}
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-[#fecaca] rounded-lg p-6">
        <h2 className="text-[14px] font-semibold text-[#ef5350] mb-3">Danger Zone</h2>
        <p className="text-[13px] text-[#5f6368] mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <Button
          onClick={() => showToast('Account deletion requires support contact', 'error')}
          variant="outline"
          className="border-[#ef5350] text-[#ef5350] hover:bg-[#fef2f2] text-[13px] h-[36px]"
        >
          Delete Account
        </Button>
      </div>

      {/* Modals */}
      {showPasswordModal && (
        <Modal title="Change password" onClose={() => setShowPasswordModal(false)}>
           <div className="space-y-4">
              <div className="space-y-1.5">
                 <label className="text-[12px] font-bold text-[#5f6368]">Current password</label>
                 <input type="password" placeholder="••••••••" className="w-full h-11 px-4 border border-gray-200 rounded-lg outline-none focus:border-[#ffce00] text-[14px]" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[12px] font-bold text-[#5f6368]">New password</label>
                 <input type="password" placeholder="••••••••" className="w-full h-11 px-4 border border-gray-200 rounded-lg outline-none focus:border-[#ffce00] text-[14px]" />
              </div>
              <Button onClick={() => { showToast('Password updated successfully', 'success'); setShowPasswordModal(false); }} className="w-full bg-[#1a1b20] hover:bg-black text-white h-11 rounded-lg font-bold text-[13px] mt-2">Update Password</Button>
           </div>
        </Modal>
      )}

      {showTwoFactorModal && (
        <Modal title="Two-factor authentication" onClose={() => setShowTwoFactorModal(false)}>
           <div className="space-y-5 text-center">
              <div className="h-48 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 border-dashed">
                 <div className="text-[#8b8e94] space-y-2">
                    <Shield className="h-10 w-10 mx-auto opacity-20" />
                    <p className="text-[12px] font-medium">QR Code Placeholder</p>
                 </div>
              </div>
              <p className="text-[13px] text-[#5f6368] leading-relaxed">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.) to enable 2FA.</p>
              <Button onClick={() => { showToast('2FA setup initiated', 'info'); setShowTwoFactorModal(false); }} className="w-full bg-[#ffce00] hover:bg-[#e6bb00] text-[#1a1b20] h-11 rounded-lg font-bold text-[13px]">I've scanned it</Button>
           </div>
        </Modal>
      )}

      {showHistoryModal && (
        <Modal title="Login history" onClose={() => setShowHistoryModal(false)}>
           <div className="space-y-3">
              {[
                { browser: 'Chrome / Windows', ip: '182.164.x.x', time: 'Just now (Current)', status: 'Success' },
                { browser: 'Safari / iPhone', ip: '182.164.x.x', time: 'Dec 18, 14:22', status: 'Success' },
                { browser: 'Chrome / Windows', ip: '172.18.x.x', time: 'Dec 15, 09:10', status: 'Success' }
              ].map((h, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                   <div>
                      <div className="text-[13px] font-bold text-[#1a1b20]">{h.browser}</div>
                      <div className="text-[11px] text-[#8b8e94]">{h.ip} • {h.time}</div>
                   </div>
                   <span className="text-[10px] font-black uppercase text-[#22c55e] bg-[#e6f4ea] px-1.5 py-0.5 rounded">{h.status}</span>
                </div>
              ))}
           </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-[24px] w-full max-w-[420px] relative shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-[16px] font-black text-[#1a1b20]">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center text-[#8b8e94] hover:bg-gray-100 rounded-full transition-colors">
            <span className="text-xl">×</span>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2.5 text-[#8b8e94]">
        {icon}
        <span className="text-[13px] font-medium">{label}</span>
      </div>
      <span className="text-[13px] font-semibold text-[#1a1b20]">{value}</span>
    </div>
  );
}

function SecurityRow({ icon, title, desc, onClick, badge }: {
  icon: React.ReactNode; title: string; desc: string; onClick: () => void; badge?: string;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-[#f4f5f7] cursor-pointer transition-colors -mx-3"
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 bg-[#f4f5f7] rounded-lg flex items-center justify-center text-[#5f6368]">
          {icon}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-[#1a1b20]">{title}</div>
          <div className="text-[12px] text-[#8b8e94]">{desc}</div>
        </div>
      </div>
      {badge && (
        <span className="text-[11px] font-semibold text-[#f59e0b] bg-[#fff7ed] px-2 py-0.5 rounded">{badge}</span>
      )}
    </div>
  );
}
