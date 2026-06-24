import React, { useState } from 'react';
import { UserProfile, Booking } from '../types';
import { motion } from 'motion/react';
import { 
  User, Settings, Link, Share2, Copy, Check, Instagram, Twitter, 
  Mail, Globe, Shield, Save, AlertCircle, Eye, EyeOff, FileText, Inbox, CheckSquare, Trash2, Upload
} from 'lucide-react';

interface ProfileSettingsProps {
  profile: UserProfile | null;
  bookings: Booking[];
  onSaveProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onAcceptBooking: (booking: Booking) => Promise<void>;
  onDeclineBooking: (id: string) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
}

export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop';

export default function ProfileSettings({
  profile,
  bookings,
  onSaveProfile,
  onAcceptBooking,
  onDeclineBooking,
  onDeleteBooking
}: ProfileSettingsProps) {
  // Form states
  const [displayName, setDisplayName] = useState(profile?.displayName || '繪師');
  const [bio, setBio] = useState(profile?.bio || '您好！我是自由插畫家，專精於日系與賽博龐克風格插畫。');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || DEFAULT_AVATAR);
  const [portfolioVisible, setPortfolioVisible] = useState(profile?.portfolioVisible !== false);
  
  // Social Links state
  const [instagram, setInstagram] = useState(profile?.socialLinks?.instagram || '');
  const [twitter, setTwitter] = useState(profile?.socialLinks?.twitter || '');
  const [pixiv, setPixiv] = useState(profile?.socialLinks?.pixiv || '');
  const [facebook, setFacebook] = useState(profile?.socialLinks?.facebook || '');
  const [contactEmail, setContactEmail] = useState(profile?.socialLinks?.email || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // File change handler for local avatar selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setAvatarUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Derive shared public URL
  const getShareUrl = () => {
    if (!profile?.uid) return '';
    return `${window.location.origin}${window.location.pathname}?freelancer=${profile.uid}`;
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('請填寫顯示名稱');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onSaveProfile({
        displayName,
        bio,
        avatarUrl,
        portfolioVisible,
        socialLinks: {
          instagram,
          twitter,
          pixiv,
          facebook,
          email: contactEmail
        }
      });
      setSuccess('個人檔案設定已儲存成功！');
    } catch (err) {
      setError('儲存個人檔案時出錯');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          個人檔案與偏好設定
        </h1>
        <p className="text-sm text-slate-500">
          設定您的公開個人主頁，讓粉絲和委託人可以查看您的作品並在線上提交預約與排單委託。
        </p>
      </div>

      {/* Share profile card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100/55 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="font-extrabold text-indigo-950 flex items-center gap-1.5 text-base">
            <Share2 className="w-5 h-5 text-indigo-600 animate-pulse" />
            您的專屬公開分享連結
          </h3>
          <p className="text-xs text-indigo-800 leading-relaxed max-w-lg">
            收到分享連結的客戶可以直接瀏覽您的公開作品，並且可以填寫詳細表格提交繪圖委託預約！
          </p>
          <div className="font-mono text-xs text-slate-500 bg-white border border-indigo-100 py-1.5 px-3 rounded-xl inline-block mt-2 select-all">
            {getShareUrl() || '正在載入中...'}
          </div>
        </div>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm cursor-pointer shrink-0 w-full md:w-auto justify-center"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> 已複製連結
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> 複製分享連結
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Settings Form */}
        <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-3 flex items-center gap-1.5">
            <User className="w-5 h-5 text-indigo-500" />
            公開資料設定
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded text-emerald-700 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            {/* Avatar Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                設定個人頭像
              </label>
              <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Current Avatar" 
                      className="w-16 h-16 rounded-2xl border-2 border-indigo-500 object-cover p-0.5 bg-white shadow-xs" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  {avatarUrl && avatarUrl !== DEFAULT_AVATAR && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(DEFAULT_AVATAR)}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-colors"
                      title="重設為預設頭像"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="relative flex flex-col items-center justify-center w-full px-4 py-4 border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl bg-slate-50/50 hover:bg-white transition-all cursor-pointer text-center group">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <p className="text-xs font-semibold text-slate-600 group-hover:text-indigo-600 flex items-center gap-1.5 justify-center">
                        <Upload className="w-4 h-4" /> 點擊選擇或拖曳圖片至此
                      </p>
                      <p className="text-[10px] text-slate-400">
                        支援 PNG, JPG 或 WEBP，將自動縮放至最佳尺寸
                      </p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
              
              {/* Custom Avatar URL */}
              <div className="mt-3">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="或貼上自訂的外部圖片 URL..."
                  className="w-full px-3.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-slate-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  公開顯示名稱 *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="繪師筆名或名稱"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  聯絡電子信箱
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                個人簡介 & 委託規範
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="向造訪您主頁的使用者介紹您的繪畫風格、可接受委託範疇（例如：R18 可、獸人 OK、不接急件等）..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-3.5 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                社群網站連結設定 (選填)
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold pointer-events-none">
                    IG
                  </span>
                  <input
                    type="url"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="Instagram 連結"
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold pointer-events-none">
                    X
                  </span>
                  <input
                    type="url"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="X / Twitter 連結"
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold pointer-events-none">
                    Pixiv
                  </span>
                  <input
                    type="url"
                    value={pixiv}
                    onChange={(e) => setPixiv(e.target.value)}
                    placeholder="Pixiv 專頁連結"
                    className="w-full pl-12 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold pointer-events-none">
                    FB
                  </span>
                  <input
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="Facebook 專頁連結"
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Global portfolio visibility */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <div>
                <span className="block text-sm font-semibold text-slate-800">在個人主頁顯示作品集區塊</span>
                <span className="text-xs text-slate-400 block">開啟後，作品集內設定為「公開顯示」的畫作將會對訪客展示。</span>
              </div>
              <button
                type="button"
                onClick={() => setPortfolioVisible(!portfolioVisible)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  portfolioVisible ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    portfolioVisible ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" /> {loading ? '儲存中...' : '儲存檔案'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Booking Requests Received (串接線上預約管理) */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-3 flex items-center gap-1.5">
              <Inbox className="w-5 h-5 text-indigo-500" />
              收到預訂排單 ({bookings.filter(b => b.status === 'pending').length})
            </h2>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {bookings.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  目前尚無客戶提交預約單
                </div>
              ) : (
                bookings.map((booking) => {
                  const statusColors = {
                    pending: 'bg-amber-50 text-amber-700 border-amber-100',
                    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    declined: 'bg-rose-50 text-rose-700 border-rose-100',
                  }[booking.status] || 'bg-slate-50';

                  return (
                    <div
                      key={booking.id}
                      className="border border-slate-100 rounded-xl p-4 space-y-2.5 bg-slate-50/50 hover:bg-white transition-all text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-900 truncate max-w-[130px]">
                          客戶: {booking.clientName}
                        </span>
                        <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full ${statusColors}`}>
                          {booking.status === 'pending' ? '待處理' : booking.status === 'accepted' ? '已接受' : '已拒絕'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-slate-800">
                          專案: {booking.title}
                        </p>
                        {booking.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                            {booking.description}
                          </p>
                        )}
                        <p className="font-semibold text-indigo-600">
                          預算：${booking.budget?.toLocaleString() || 0} TWD
                        </p>
                        <p className="text-[10px] text-slate-400">
                          信箱: {booking.clientEmail}
                        </p>
                      </div>

                      {booking.status === 'pending' && (
                        <div className="flex gap-1.5 pt-2 border-t border-slate-100 justify-end">
                          <button
                            onClick={() => onDeclineBooking(booking.id)}
                            className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold cursor-pointer"
                          >
                            拒絕
                          </button>
                          <button
                            onClick={() => onAcceptBooking(booking)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer flex items-center gap-1"
                          >
                            <CheckSquare className="w-3 h-3" /> 接受並建檔
                          </button>
                        </div>
                      )}

                      {booking.status !== 'pending' && (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400">已處理</span>
                          <button
                            onClick={() => {
                              if (window.confirm('確定要刪除這筆預訂記錄嗎？')) {
                                onDeleteBooking(booking.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
