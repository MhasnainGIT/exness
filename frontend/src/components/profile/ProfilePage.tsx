import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Shield, Key, CheckCircle, Clock, XCircle } from 'lucide-react';

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [tab, setTab] = useState<'profile' | 'security' | 'kyc'>('profile');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', country: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [kycDocs, setKycDocs] = useState([{ type: 'passport', fileUrl: '' }]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });

  useEffect(() => {
    fetchApi('/users/me').then(d => {
      setProfile(d);
      setForm({ firstName: d.firstName || '', lastName: d.lastName || '', phone: d.phone || '', country: d.country || '' });
    }).catch(console.error);
  }, []);

  const saveProfile = async () => {
    setSaving(true); setMsg({ text: '', ok: true });
    try {
      await fetchApi('/users/me', { method: 'PATCH', body: JSON.stringify(form) });
      setMsg({ text: 'Profile updated!', ok: true });
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { setMsg({ text: 'Passwords do not match', ok: false }); return; }
    setSaving(true); setMsg({ text: '', ok: true });
    try {
      await fetchApi('/users/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }) });
      setMsg({ text: 'Password changed! Please login again.', ok: true });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
    finally { setSaving(false); }
  };

  const submitKyc = async () => {
    setSaving(true); setMsg({ text: '', ok: true });
    try {
      await fetchApi('/users/kyc', { method: 'POST', body: JSON.stringify({ documents: kycDocs.filter(d => d.fileUrl) }) });
      setMsg({ text: 'KYC submitted for review!', ok: true });
    } catch (e: any) { setMsg({ text: e.message, ok: false }); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full bg-sleek-panel border border-sleek-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-sleek-gold";
  const labelCls = "text-[10px] font-black text-sleek-muted uppercase tracking-widest block mb-2";

  const kycBadge = () => {
    const s = profile?.kycStatus;
    if (s === 'VERIFIED') return <span className="flex items-center gap-1 text-sleek-green text-xs font-black"><CheckCircle className="h-3 w-3" /> Verified</span>;
    if (s === 'PENDING') return <span className="flex items-center gap-1 text-sleek-gold text-xs font-black"><Clock className="h-3 w-3" /> Pending Review</span>;
    if (s === 'REJECTED') return <span className="flex items-center gap-1 text-sleek-red text-xs font-black"><XCircle className="h-3 w-3" /> Rejected</span>;
    return <span className="flex items-center gap-1 text-sleek-muted text-xs font-black"><XCircle className="h-3 w-3" /> Not Started</span>;
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'kyc', label: 'Verification', icon: Shield },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-sleek-panel border border-sleek-border flex items-center justify-center">
          <User className="h-8 w-8 text-sleek-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{profile?.firstName} {profile?.lastName}</h1>
          <p className="text-sleek-muted text-sm">{profile?.email}</p>
          <div className="mt-1">{kycBadge()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sleek-border gap-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setMsg({ text: '', ok: true }); }}
            className={`flex items-center gap-2 pb-3 text-xs font-black uppercase tracking-widest transition-colors ${tab === t.id ? 'text-sleek-gold border-b-2 border-sleek-gold' : 'text-sleek-muted hover:text-white'}`}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      <Card className="bg-sleek-panel border border-sleek-border">
        <CardContent className="p-6 space-y-4">
          {tab === 'profile' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>First Name</label>
                  <input className={inputCls} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
                <div><label className={labelCls}>Last Name</label>
                  <input className={inputCls} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
              </div>
              <div><label className={labelCls}>Phone</label>
                <input className={inputCls} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1234567890" /></div>
              <div><label className={labelCls}>Country</label>
                <input className={inputCls} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
              <div><label className={labelCls}>Email</label>
                <input className={inputCls} value={profile?.email || ''} disabled /></div>
            </>
          )}

          {tab === 'security' && (
            <>
              <div><label className={labelCls}>Current Password</label>
                <input type="password" className={inputCls} value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
              <div><label className={labelCls}>New Password</label>
                <input type="password" className={inputCls} value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
              <div><label className={labelCls}>Confirm New Password</label>
                <input type="password" className={inputCls} value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} /></div>
            </>
          )}

          {tab === 'kyc' && (
            <>
              <div className="p-4 bg-sleek-darker rounded-lg border border-sleek-border">
                <p className="text-sm text-sleek-muted">Status: {kycBadge()}</p>
                <p className="text-xs text-sleek-muted mt-2">Submit government-issued ID and proof of address to verify your account.</p>
              </div>
              {kycDocs.map((doc, i) => (
                <div key={i} className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Document Type</label>
                      <select className={inputCls} value={doc.type} onChange={e => { const d = [...kycDocs]; d[i].type = e.target.value; setKycDocs(d); }}>
                        {['passport', 'national_id', 'drivers_license', 'utility_bill', 'bank_statement'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                      </select></div>
                    <div><label className={labelCls}>File URL</label>
                      <input className={inputCls} value={doc.fileUrl} onChange={e => { const d = [...kycDocs]; d[i].fileUrl = e.target.value; setKycDocs(d); }} placeholder="https://..." /></div>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setKycDocs([...kycDocs, { type: 'passport', fileUrl: '' }])}
                className="text-sleek-gold hover:text-sleek-gold/80 text-xs font-black">+ Add Document</Button>
            </>
          )}

          {msg.text && <p className={`text-sm font-bold ${msg.ok ? 'text-sleek-green' : 'text-sleek-red'}`}>{msg.text}</p>}

          <Button onClick={tab === 'profile' ? saveProfile : tab === 'security' ? changePassword : submitKyc}
            disabled={saving} className="w-full bg-sleek-gold hover:bg-sleek-gold/90 text-black font-black h-11 uppercase tracking-wider">
            {saving ? 'Saving...' : tab === 'profile' ? 'Save Changes' : tab === 'security' ? 'Change Password' : 'Submit KYC'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
