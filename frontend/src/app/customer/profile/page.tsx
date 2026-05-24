'use client';
import { useState, useEffect, useRef } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { Card, CardBody, Input, Button, CardHeader, Divider, Spinner } from '@nextui-org/react';
import { FiSave, FiLock, FiUser, FiMapPin, FiPhone, FiCamera, FiMail } from 'react-icons/fi';

export default function CustomerProfilePage() {
  const { user, loading: authLoading } = useRequireRole('customer');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [profile, setProfile]   = useState({
    first_name: '', middle_name: '', last_name: '',
    email: '', contact_number: '', address: ''
  });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [emailForm, setEmailForm] = useState({ new_email: '', current_password: '' });
  const [emailSaving, setEmailSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetch('/api/customer/profile.php')
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            setProfile(res.data);
            setPhotoUrl(res.data.photo_url || null);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
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
      const res  = await fetch('/api/customer/profile.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) alert('Profile updated successfully!');
      else alert(data.message || 'Update failed');
    } catch { alert('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) return alert('Please fill all password fields');
    if (passwords.new !== passwords.confirm) return alert('New passwords do not match');
    setSaving(true);
    try {
      const res  = await fetch('/api/customer/profile.php', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
      });
      const data = await res.json();
      if (data.success) { alert('Password changed successfully!'); setPasswords({ current: '', new: '', confirm: '' }); }
      else alert(data.message || 'Failed to change password');
    } catch { alert('Error updating password'); }
    finally { setSaving(false); }
  };

  const handleChangeEmail = async () => {
    if (!emailForm.new_email || !emailForm.current_password) return alert('Please fill in all fields.');
    setEmailSaving(true);
    try {
      const res  = await fetch('/api/customer/profile.php', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(p => ({ ...p, email: emailForm.new_email }));
        setEmailForm({ new_email: '', current_password: '' });
        alert('Email updated successfully! Please log in again.');
      } else alert(data.message || 'Failed to update email');
    } catch { alert('Error updating email'); }
    finally { setEmailSaving(false); }
  };

  if (authLoading || loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-900 italic">My Account</h1>
        <p className="text-default-500 font-medium tracking-wide uppercase text-xs">Manage your personal profile and security</p>
      </div>

      {/* Avatar Section */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardBody className="p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg bg-slate-100">
              {photoUrl
                ? <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-blue-50">
                    <FiUser size={40} className="text-blue-300" />
                  </div>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition-colors"
            >
              {uploading ? <Spinner size="sm" color="white" /> : <FiCamera size={14} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-black text-lg text-blue-900">{profile.first_name} {profile.last_name}</p>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP or GIF · Max 3MB</p>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Card */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="flex gap-4 px-8 py-6 bg-blue-50/50">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200"><FiUser size={24} /></div>
            <div>
              <p className="font-black text-blue-900">Personal Details</p>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Profile Info</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="p-8 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="First Name"   variant="bordered" radius="lg" value={profile.first_name}   onValueChange={v => setProfile(p => ({...p, first_name: v}))} />
              <Input label="Middle Name"  variant="bordered" radius="lg" value={profile.middle_name}  onValueChange={v => setProfile(p => ({...p, middle_name: v}))} />
              <Input label="Last Name"    variant="bordered" radius="lg" value={profile.last_name}    onValueChange={v => setProfile(p => ({...p, last_name: v}))} />
            </div>
            <Input label="Email Address" variant="bordered" radius="lg" isDisabled value={profile.email} description="Use the Email section below to change your email." />
            <Input label="Contact Number" variant="bordered" radius="lg" startContent={<FiPhone className="text-default-400" />} value={profile.contact_number} onValueChange={v => setProfile(p => ({...p, contact_number: v}))} />
            <Input label="Home Address"   variant="bordered" radius="lg" startContent={<FiMapPin className="text-default-400" />} value={profile.address} onValueChange={v => setProfile(p => ({...p, address: v}))} />
            <Button color="primary" className="font-bold h-14 rounded-2xl shadow-xl shadow-blue-200 mt-2" startContent={<FiSave />} isLoading={saving} onPress={handleUpdateProfile}>
              Update Profile Information
            </Button>
          </CardBody>
        </Card>

        {/* Security Card */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden self-start">
          <CardHeader className="flex gap-4 px-8 py-6 bg-red-50/50">
            <div className="p-3 bg-red-500 rounded-2xl text-white shadow-lg shadow-red-200"><FiLock size={24} /></div>
            <div>
              <p className="font-black text-red-900">Account Security</p>
              <p className="text-xs text-red-600 font-bold uppercase tracking-widest">Update Password</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="p-8 gap-6">
            <Input label="Current Password"     type="password" variant="bordered" radius="lg" value={passwords.current} onValueChange={v => setPasswords(p => ({...p, current: v}))} />
            <Input label="New Password"         type="password" variant="bordered" radius="lg" value={passwords.new}     onValueChange={v => setPasswords(p => ({...p, new: v}))} />
            <Input label="Confirm New Password" type="password" variant="bordered" radius="lg" value={passwords.confirm} onValueChange={v => setPasswords(p => ({...p, confirm: v}))} />
            <Button color="danger" variant="flat" className="font-bold h-14 rounded-2xl mt-2" isLoading={saving} onPress={handleChangePassword}>
              Change My Password
            </Button>
          </CardBody>
        </Card>

        {/* Email Change Card */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden self-start">
          <CardHeader className="flex gap-4 px-8 py-6 bg-amber-50/50">
            <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-200"><FiMail size={24} /></div>
            <div>
              <p className="font-black text-amber-900">Change Email</p>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-widest">Update Email Address</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="p-8 gap-6">
            <Input label="New Email Address" type="email" variant="bordered" radius="lg"
              value={emailForm.new_email}
              onValueChange={v => setEmailForm(p => ({...p, new_email: v}))}
              description={`Current: ${profile.email}`} />
            <Input label="Confirm with Password" type="password" variant="bordered" radius="lg"
              value={emailForm.current_password}
              onValueChange={v => setEmailForm(p => ({...p, current_password: v}))}
              description="Enter your current password to confirm." />
            <Button color="warning" variant="flat" className="font-bold h-14 rounded-2xl mt-2" isLoading={emailSaving} onPress={handleChangeEmail}>
              Update Email Address
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
