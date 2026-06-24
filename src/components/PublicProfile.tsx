import React, { useState } from 'react';
import { UserProfile, PortfolioItem } from '../types';
import { motion } from 'motion/react';
import { 
  Send, Mail, Instagram, Twitter, Heart, Calendar, DollarSign, 
  User, CheckCircle2, Globe, FileText, Compass, AlertCircle
} from 'lucide-react';

interface PublicProfileProps {
  profile: UserProfile;
  portfolio: PortfolioItem[];
  onSubmitBooking: (booking: {
    clientName: string;
    clientEmail: string;
    title: string;
    description: string;
    budget: number;
  }) => Promise<void>;
}

export default function PublicProfile({
  profile,
  portfolio,
  onSubmitBooking
}: PublicProfileProps) {
  // Booking Form states
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !title) {
      setError('請填寫必填欄位 (您的姓名、電子信箱、委託專案名稱)');
      return;
    }
    if (budget < 0) {
      setError('價格預算不可小於 0');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmitBooking({
        clientName,
        clientEmail,
        title,
        description,
        budget: Number(budget)
      });
      setSuccess(true);
      // Reset form
      setClientName('');
      setClientEmail('');
      setTitle('');
      setDescription('');
      setBudget(0);
    } catch (err) {
      setError('預訂提交失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  // Only display visible portfolio items
  const visiblePortfolio = portfolio.filter(item => item.visible);

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Profile Card Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-center"
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              referrerPolicy="no-referrer"
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover p-1.5 border border-slate-100 bg-slate-50 shadow-xs"
            />
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1.5">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {profile.displayName}
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                <Compass className="w-3.5 h-3.5" /> 自由插畫家 (開放預約接單中)
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
              {profile.bio || '尚未填寫個人簡介與委託規範。'}
            </p>

            {/* Social Links */}
            <div className="flex justify-center md:justify-start gap-3.5 pt-2 flex-wrap">
              {profile.socialLinks?.instagram && (
                <a
                  href={profile.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-all border border-slate-150"
                  title="Instagram"
                >
                  <Instagram className="w-4.5 h-4.5" />
                </a>
              )}
              {profile.socialLinks?.twitter && (
                <a
                  href={profile.socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-all border border-slate-150"
                  title="Twitter / X"
                >
                  <Twitter className="w-4.5 h-4.5" />
                </a>
              )}
              {profile.socialLinks?.pixiv && (
                <a
                  href={profile.socialLinks.pixiv}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-all border border-slate-150 text-xs font-bold"
                  title="Pixiv"
                >
                  Pixiv
                </a>
              )}
              {profile.socialLinks?.facebook && (
                <a
                  href={profile.socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-all border border-slate-150 text-xs font-bold"
                  title="Facebook"
                >
                  Facebook
                </a>
              )}
              {profile.socialLinks?.email && (
                <a
                  href={`mailto:${profile.socialLinks.email}`}
                  className="p-2 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-all border border-slate-150"
                  title="Email"
                >
                  <Mail className="w-4.5 h-4.5" />
                </a>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left: Portfolio Gallery */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-indigo-500" />
              精選插畫作品集
            </h2>

            {/* Check if user hidden portfolio section */}
            {profile.portfolioVisible === false ? (
              <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center text-slate-400 text-sm">
                藝術家暫未開放公開作品集瀏覽。
              </div>
            ) : visiblePortfolio.length === 0 ? (
              <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center text-slate-400 text-sm">
                目前尚無公開的繪畫作品。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {visiblePortfolio.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:border-slate-200 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="aspect-video bg-slate-100 overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-1.5 flex-1">
                      <h4 className="font-extrabold text-slate-900 text-sm truncate">{item.title}</h4>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Booking Reservation Form */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              委託與預訂排單表格
            </h2>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
              {success ? (
                <div className="text-center py-8 space-y-4">
                  <div className="inline-flex p-3 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">預訂委託已順利提交！</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    我們已將您的排單需求發送至繪師。繪師確認需求與檔期後，將會透過您留下的電子信箱與您聯絡，謝謝您的支持！
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-4 px-4 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    再次提交預約委託
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/40">
                    💡 填寫以下表單以向繪師預訂作畫。繪師收到後可在後台將此案件轉化為正式專案。
                  </p>

                  {error && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      您的姓名 *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="您的暱稱或聯絡人姓名"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      您的聯絡電子信箱 *
                    </label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="如：client@example.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      委託專案標題 *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="如：個人大頭貼/小說封面插畫"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      委託預算 (TWD)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      placeholder="預算金額"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      詳細作畫需求 / 委託細節描述
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="請說明繪圖用途、角色特徵、構圖想法、交件格式與預期完成日期等..."
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> {loading ? '傳送中...' : '送出委託預訂'}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
