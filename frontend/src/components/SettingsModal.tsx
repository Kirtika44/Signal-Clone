'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Palette,
  Shield,
  Bell,
  Video,
  Mic,
  Info,
  Check,
  Ban,
  UserX,
  RefreshCw
} from 'lucide-react';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { User } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'appearance' | 'privacy' | 'media' | 'about'>('appearance');

  // Privacy & notification preferences
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);

  // Camera & Mic testing
  const [testingMedia, setTestingMedia] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Load blocked users
      api.getBlockedUsers()
        .then(async (ids: number[]) => {
          if (Array.isArray(ids) && ids.length > 0) {
            const allUsers = await api.discoverUsers().catch(() => []);
            const blocked = (allUsers || []).filter((u: User) => ids.includes(u.id));
            setBlockedUsers(blocked);
          } else {
            setBlockedUsers([]);
          }
        })
        .catch(console.error);
    } else {
      stopMediaTest();
    }
  }, [isOpen]);

  const handleUnblock = async (userId: number) => {
    try {
      await api.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      alert('Failed to unblock: ' + err.message);
    }
  };

  const startMediaTest = async () => {
    try {
      setTestingMedia(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        alert('Media devices not supported on this origin.');
      }
    } catch (err: any) {
      alert('Camera/Microphone error: ' + err.message);
      setTestingMedia(false);
    }
  };

  const stopMediaTest = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
    setTestingMedia(false);
  };

  if (!isOpen) return null;

  const themes: { id: ThemeMode; name: string; desc: string; previewBg: string; border: string }[] = [
    {
      id: 'dark-navy',
      name: 'Signal Dark Navy (Default)',
      desc: 'Authentic Signal navy blue aesthetic',
      previewBg: 'bg-[#0a101d]',
      border: 'border-blue-600',
    },
    {
      id: 'oled',
      name: 'Midnight OLED Black',
      desc: 'True pure black for maximum contrast',
      previewBg: 'bg-black',
      border: 'border-slate-800',
    },
    {
      id: 'indigo',
      name: 'Midnight Indigo',
      desc: 'Rich indigo & violet dark theme',
      previewBg: 'bg-[#0b0d1e]',
      border: 'border-indigo-600',
    },
    {
      id: 'light',
      name: 'Signal Light',
      desc: 'Clean daylight appearance',
      previewBg: 'bg-slate-100',
      border: 'border-slate-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-xl bg-[#0e1726] border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[85vh]">
        <button
          onClick={() => {
            stopMediaTest();
            onClose();
          }}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Settings & Preferences</h2>
        <p className="text-xs text-slate-400 mb-4">
          Themes, Camera & Mic tests, Blocked Contacts, and Privacy
        </p>

        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 mb-4 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors ${
              activeTab === 'appearance'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Themes</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors ${
              activeTab === 'media'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Camera & Mic</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Blocked ({blockedUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors ${
              activeTab === 'about'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* 1. Themes */}
          {activeTab === 'appearance' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Choose Default App Palette:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {themes.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-600/10 ring-1 ring-blue-500'
                          : 'border-slate-800 bg-[#121c2e] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-5 h-5 rounded-full ${t.previewBg} border border-slate-600 shadow-inner`} />
                          <span className="font-semibold text-xs text-white">{t.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{t.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Camera & Microphone Testing */}
          {activeTab === 'media' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#121c2e] border border-slate-800">
                <h4 className="font-semibold text-white mb-1 flex items-center space-x-2">
                  <Video className="w-4 h-4 text-blue-400" />
                  <span>Hardware Testing (Camera & Microphone)</span>
                </h4>
                <p className="text-slate-400 text-[11px] mb-4">
                  Verify browser permissions and test your live video and microphone feed.
                </p>

                {testingMedia ? (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-700">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Live Video Active
                      </span>
                    </div>

                    <button
                      onClick={stopMediaTest}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-xs transition-colors"
                    >
                      Stop Camera Test
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startMediaTest}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs transition-colors shadow-md shadow-blue-600/30 flex items-center space-x-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>Test Camera & Microphone</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. Privacy & Blocked Users */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[#121c2e] border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white">Read Receipts</h4>
                    <p className="text-[11px] text-slate-400">Show double blue checkmarks when seen</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={readReceipts}
                    onChange={(e) => setReadReceipts(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#121c2e] border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white">Typing Indicators</h4>
                    <p className="text-[11px] text-slate-400">Display typing animation to other users</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={typingIndicators}
                    onChange={(e) => setTypingIndicators(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </div>
              </div>

              {/* Blocked Users Section */}
              <div className="pt-2">
                <h4 className="font-bold text-slate-300 uppercase text-[11px] tracking-wider mb-2">
                  Blocked Contacts ({blockedUsers.length})
                </h4>
                {blockedUsers.length === 0 ? (
                  <p className="text-slate-500 italic p-3 bg-[#111a2c] rounded-xl text-center">
                    No blocked contacts. You can block any user directly from their chat header menu.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {blockedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-2.5 rounded-xl bg-[#121c2e] border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={u.avatar_url}
                            alt={u.display_name}
                            className="w-7 h-7 rounded-full"
                          />
                          <div>
                            <span className="font-semibold text-white">{u.display_name}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">@{u.username}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnblock(u.id)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. About */}
          {activeTab === 'about' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-700/40">
                <h4 className="font-bold text-sm text-white mb-1">Signal Clone V1.0</h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  High-fidelity private messaging platform with SQLite persistence, WebSockets, WebRTC calling, and Signal AI intelligence.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#121c2e] border border-slate-800 space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Camera & Microphone:</span>
                  <span className="text-emerald-400 font-medium">WebRTC Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chat Wallpaper:</span>
                  <span className="text-blue-400 font-medium">Customizable</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Blocking:</span>
                  <span className="text-emerald-400 font-medium">Active</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Done Button */}
        <div className="pt-3 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={() => {
              stopMediaTest();
              onClose();
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
