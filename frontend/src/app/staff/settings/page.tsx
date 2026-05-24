'use client';
import { useState, useEffect, useRef } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { Card, CardBody, Input, Button, CardHeader, Divider, Spinner } from '@nextui-org/react';
import { FiSave, FiLock, FiUser, FiCamera, FiMail } from 'react-icons/fi';
import { readJson } from '@/lib/api';

export default function StaffSettingsPage() {
  const { user, loading: authLoading } = useRequireRole('staff');
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl]   = useState<string | null>(null);
  const [profile, setProfile]     = useState({ first_name: '', last_name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [emailForm, setEmailForm] = useState({ new_email: '', current_password: '' });
  const [emailSaving, setEmailSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetch('/api/staff/profile.php')
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            setProfile({ first_name: res.data.first_name, last_name: res.data.last_name, email: res.data.email });
            setPhotoUrl(res.data.photo_url || null);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const compressImage = (file: File, maxSizeKB = 800): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        let quality = 0.85;
        const tryCompress = () => {
          canvas.toBlob(blob => {
            if (!blob) return reject(new Error('Compression failed'));
            if (blob.size <= maxSizeKB * 1024 || quality <= 0.3) return resolve(blob);
            quality -= 0.1;
            tryCompress();
          }, 'image/jpeg', quality);
        };
        tryCompress();
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append('avatar', compressed, 'avatar.jpg');
      const res  = await fetch('/api/upload_avatar.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        const separator = data.photo_url.includes('?') ? '&' : '?';
        setPhotoUrl(data.photo_url + separator + 't=' + Date.now());
      }
      else alert(data.message || 'Upload failed');
    } catch { alert('Upload error'); }
    finally { setUploading(false); }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const res  = await fetch('/api/staff/profile.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await readJson(res);
      if (data.success) alert('Profile updated! Please log in again to see changes.');
    } catch { alert('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangeEmail = async () => {
    if (!emailForm.new_email || !emailForm.current_password) return alert('Fill in all fields.');
    setEmailSaving(true);
    try {
      const res  = await fetch('/api/staff/profile.php', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(p => ({ ...p, email: emailForm.new_email }));
        setEmailForm({ new_email: '', current_password: '' });
        alert('Email updated successfully!');
      } else alert(data.message || 'Failed to update email');
    } catch { alert('Error updating email'); }
    finally { setEmailSaving(false); }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) return alert('New passwords do not match');
    setSaving(true);
    try {
      const res  = await fetch('/api/staff/profile.php', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
      });
      const data = await readJson(res);
      if (data.success) { alert('Password changed successfully!'); setPasswords({ current: '', new: '', confirm: '' }); }
      else alert(data.message || 'Failed to change password');
    } catch { alert('Error updating password'); }
    finally { setSaving(false); }
  };

  if (authLoading) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-success">Staff Settings</h1>
        <p className="text-default-500">Manage your account profile and security</p>
      </div>

      {/* Avatar Section */}
      <Card className="border-none shadow-sm">
        <CardBody className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-success/20 shadow-md bg-slate-100">
              {photoUrl
                ? <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-success/10">
                    <FiUser size={36} className="text-success/40" />
                  </div>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-success rounded-full flex items-center justify-center text-white shadow hover:bg-success/80 transition-colors"
            >
              {uploading ? <Spinner size="sm" color="white" /> : <FiCamera size={13} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-bold text-base">{profile.first_name} {profile.last_name}</p>
            <p className="text-sm text-default-500">{profile.email}</p>
            <p className="text-xs text-default-400 mt-1">JPG, PNG, WEBP or GIF · Max 3MB</p>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex gap-3 px-6 py-4">
            <div className="p-2 bg-success/10 rounded-lg text-success"><FiUser size={20} /></div>
            <p className="font-bold">My Profile</p>
          </CardHeader>
          <Divider />
          <CardBody className="p-6 gap-4">
            <Input label="First Name" variant="bordered" value={profile.first_name} onValueChange={v => setProfile(p => ({...p, first_name: v}))} />
            <Input label="Last Name"  variant="bordered" value={profile.last_name}  onValueChange={v => setProfile(p => ({...p, last_name: v}))} />
            <Input label="Email Address" variant="bordered" isDisabled value={profile.email} description="Use the Change Email section below to update your email." />
            <Button color="success" className="font-bold text-white shadow-lg shadow-success/20" startContent={<FiSave />} isLoading={saving} onPress={handleUpdateProfile}>
              Save Profile
            </Button>
          </CardBody>
        </Card>

        {/* Password Card */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex gap-3 px-6 py-4">
            <div className="p-2 bg-danger/10 rounded-lg text-danger"><FiLock size={20} /></div>
            <p className="font-bold">Security</p>
          </CardHeader>
          <Divider />
          <CardBody className="p-6 gap-4">
            <Input label="Current Password"     type="password" variant="bordered" value={passwords.current} onValueChange={v => setPasswords(p => ({...p, current: v}))} />
            <Input label="New Password"         type="password" variant="bordered" value={passwords.new}     onValueChange={v => setPasswords(p => ({...p, new: v}))} />
            <Input label="Confirm New Password" type="password" variant="bordered" value={passwords.confirm} onValueChange={v => setPasswords(p => ({...p, confirm: v}))} />
            <Button color="danger" variant="flat" className="font-bold" isLoading={saving} onPress={handleChangePassword}>
              Change Password
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Change Email Card */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex gap-3 px-6 py-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><FiMail size={20} /></div>
          <p className="font-bold">Change Email</p>
        </CardHeader>
        <Divider />
        <CardBody className="p-6 gap-4">
          <Input
            label="New Email Address"
            type="email"
            variant="bordered"
            value={emailForm.new_email}
            onValueChange={v => setEmailForm(p => ({ ...p, new_email: v }))}
          />
          <Input
            label="Current Password"
            type="password"
            variant="bordered"
            value={emailForm.current_password}
            onValueChange={v => setEmailForm(p => ({ ...p, current_password: v }))}
            description="Required to confirm your identity."
          />
          <Button color="primary" className="font-bold" startContent={<FiSave />} isLoading={emailSaving} onPress={handleChangeEmail}>
            Update Email
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
