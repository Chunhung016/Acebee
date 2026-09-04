import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Upload,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Link,
  Image as ImageIcon,
} from 'lucide-react';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateAccount } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUser?.avatarUrl || null);
  const [urlInput, setUrlInput] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP, etc.)');
      return;
    }

    // Limit to 3MB
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 3MB.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMsg('Please enter a valid image URL');
      return;
    }
    setErrorMsg(null);
    setPreviewUrl(urlInput.trim());
    setUrlInput('');
  };

  const handleSave = () => {
    setIsSaving(true);
    setErrorMsg(null);

    try {
      updateAccount(currentUser.id, {
        avatarUrl: previewUrl || undefined,
      });

      setSuccessMsg('Profile picture updated successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        setIsSaving(false);
        onClose();
      }, 1000);
    } catch {
      setErrorMsg('Failed to update profile picture. Please try again.');
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center">
              <Camera className="w-4 h-4 text-blue-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-['Plus_Jakarta_Sans',sans-serif]">
                Update Profile Photo
              </h3>
              <p className="text-[11px] text-blue-200">
                {currentUser.fullName} ({currentUser.role.toUpperCase()})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current / New Preview */}
          <div className="flex flex-col items-center justify-center gap-3 py-2">
            <div className="relative group">
              <UserAvatar
                name={currentUser.fullName}
                avatarUrl={previewUrl}
                role={currentUser.role}
                size="xl"
                className="w-24 h-24 text-2xl shadow-md border-2 border-slate-200"
              />
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition-colors"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {previewUrl ? 'Current selected photo' : 'Default initials placeholder'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                uploadMode === 'file'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image File
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                uploadMode === 'url'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              Image Web URL
            </button>
          </div>

          {uploadMode === 'file' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer hover:bg-blue-50/40 transition-colors space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Click to select photo from device
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports PNG, JPG, WebP up to 3MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Direct Image Link (HTTPS)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 shrink-0"
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
            >
              {isSaving ? 'Saving...' : 'Save Profile Photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
