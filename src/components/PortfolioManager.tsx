import React, { useState } from 'react';
import { PortfolioItem, Commission } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, Plus, Trash2, Eye, EyeOff, X, AlertCircle, Sparkles, Check, Upload, Briefcase, Link
} from 'lucide-react';

interface PortfolioManagerProps {
  portfolio: PortfolioItem[];
  commissions: Commission[];
  onAddPortfolioItem: (item: Omit<PortfolioItem, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  onDeletePortfolioItem: (id: string) => Promise<void>;
  onTogglePortfolioItemVisibility: (id: string, visible: boolean) => Promise<void>;
}

export const PORTFOLIO_PRESETS = [
  {
    title: '賽博龐克風格角色插畫',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop',
    description: '細緻的霓虹燈光渲染，搭配科技感機械義肢。'
  },
  {
    title: '日系奇幻星空插畫',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop',
    description: '浪漫的夜空、流星與翱翔天際的少女。'
  },
  {
    title: '療癒水彩森林插圖',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&auto=format&fit=crop',
    description: '溫暖的水彩筆觸，森林小動物與花草。'
  },
  {
    title: '蒸氣龐克飛船設定圖',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop',
    description: '巨大的蒸氣引擎、飛空艇以及複雜的齒輪細節。'
  }
];

export default function PortfolioManager({
  portfolio,
  commissions = [],
  onAddPortfolioItem,
  onDeletePortfolioItem,
  onTogglePortfolioItemVisibility
}: PortfolioManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom helper states
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedCommissionId, setSelectedCommissionId] = useState('');

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 960;
        const MAX_HEIGHT = 720;
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
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setImageUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCommission = (commissionId: string) => {
    const comm = commissions.find(c => c.id === commissionId);
    if (comm) {
      setTitle(comm.title);
      setDescription(comm.description || `本作品為為「${comm.clientName}」委託製作的完成插畫。`);
      setSelectedCommissionId(commissionId);
    }
  };

  const handleSelectPreset = (preset: typeof PORTFOLIO_PRESETS[0]) => {
    setTitle(preset.title);
    setImageUrl(preset.imageUrl);
    setDescription(preset.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      setError('請輸入作品標題並提供或選擇圖片網址');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onAddPortfolioItem({
        title,
        imageUrl,
        description,
        visible
      });
      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setImageUrl('');
      setDescription('');
      setVisible(true);
    } catch (err) {
      setError('儲存作品失敗，請再試一次');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`確定要將「${name}」從作品集中刪除嗎？`)) {
      try {
        await onDeletePortfolioItem(id);
      } catch (err) {
        alert('刪除失敗');
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-600" />
            作品集管理
          </h1>
          <p className="text-sm text-slate-500">
            在此展示您已完成的得意作品，公開作品集將分享於您的個人簡介頁面中。
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setTitle('');
            setImageUrl('');
            setDescription('');
            setSelectedCommissionId('');
            setShowUrlInput(false);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> 上傳新作品
        </button>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolio.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            作品集空空如也。立即上傳您完成的作品，建立完美的委託宣傳頁面！
          </div>
        ) : (
          portfolio.map((item) => (
            <motion.div
              layout
              key={item.id}
              className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-200 transition-all group flex flex-col"
            >
              {/* Image Container with Hover Action */}
              <div className="relative aspect-video bg-slate-100 overflow-hidden shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to lovely illustration placeholder if loading fails
                    e.currentTarget.src = "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&auto=format&fit=crop";
                  }}
                />
                
                {/* Overlay Visibility Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs border ${
                    item.visible 
                      ? 'bg-emerald-500 text-white border-emerald-400' 
                      : 'bg-slate-700 text-white border-slate-600'
                  }`}>
                    {item.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {item.visible ? '公開顯示' : '已隱藏'}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 truncate text-base">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed min-h-[32px]">
                    {item.description || '無描述資訊'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 mt-4 pt-3">
                  {/* Toggle Visibility button */}
                  <button
                    onClick={() => onTogglePortfolioItemVisibility(item.id, !item.visible)}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                    title={item.visible ? "設定為隱藏" : "設定為公開"}
                  >
                    {item.visible ? (
                      <>
                        <EyeOff className="w-4 h-4" /> 隱藏此作品
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" /> 公開此作品
                      </>
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="刪除作品"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Portfolio Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  新增作品集項目
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {error && (
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Local Image Upload Section */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    作品圖片（支援拖曳或上傳）*
                  </label>
                  
                  {imageUrl ? (
                    <div className="relative group border border-slate-200 rounded-2xl overflow-hidden aspect-video bg-slate-100">
                      <img src={imageUrl} alt="Portfolio Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors shadow-xs">
                          更換圖片
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrl('');
                          }}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                        >
                          清除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl bg-slate-50/50 hover:bg-white transition-all cursor-pointer text-center group">
                      <div className="flex flex-col items-center justify-center space-y-2 p-6">
                        <div className="p-3 bg-white rounded-2xl shadow-xs group-hover:scale-105 transition-transform">
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                            點擊選擇或拖曳圖片至此
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            支援 PNG, JPG 或 WEBP 格式，自動壓縮優化
                          </p>
                        </div>
                      </div>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Import Completed Commissions */}
                {commissions.filter(c => c.status === 'completed').length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                      直接套入已完成的委託案件：
                    </label>
                    <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto py-1">
                      {commissions.filter(c => c.status === 'completed').map((comm) => (
                        <button
                          key={comm.id}
                          type="button"
                          onClick={() => handleApplyCommission(comm.id)}
                          className={`px-3 py-1.5 text-xs rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer max-w-full truncate ${
                            selectedCommissionId === comm.id 
                              ? 'bg-indigo-600 border-indigo-600 text-white font-semibold' 
                              : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedCommissionId === comm.id ? 'bg-white' : 'bg-emerald-500'}`} />
                          <span className="truncate">{comm.title} (客戶: {comm.clientName})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preset Suggestions */}
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    ✨ 快速套用範例繪圖素材：
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {PORTFOLIO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          handleSelectPreset(preset);
                          setSelectedCommissionId('');
                        }}
                        className={`text-left p-1.5 border border-slate-150 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/20 text-xs flex gap-2 items-center transition-all cursor-pointer ${
                          imageUrl === preset.imageUrl ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500' : ''
                        }`}
                      >
                        <img 
                          src={preset.imageUrl} 
                          alt="" 
                          className="w-8 h-8 rounded-md object-cover shrink-0" 
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate text-[11px]">{preset.title}</p>
                          <p className="text-[9px] text-slate-400 truncate">點擊套用</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    作品名稱 *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="輸入作品標題"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    作品敘述說明
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="簡單介紹這幅作品的背景故事、委託人或是所使用的繪圖技巧/工具..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  />
                </div>

                {/* Toggle External Link Input if Advanced */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Link className="w-3 h-3" /> {showUrlInput ? '隱藏自訂網址輸入' : '進階：手動貼上圖片網址連結'}
                  </button>
                </div>

                {showUrlInput && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      作品圖片連結 URL
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="請輸入圖片 HTTP/HTTPS 網址"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    />
                  </div>
                )}

                {/* Visible status checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="visible"
                    checked={visible}
                    onChange={(e) => setVisible(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="visible" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                    公開顯示於個人宣傳作品集頁面中
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
                  >
                    {loading ? '儲存中...' : '確認發佈'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
