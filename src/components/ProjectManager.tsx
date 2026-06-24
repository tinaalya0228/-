import React, { useState } from 'react';
import { Commission } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, Plus, Search, Filter, Edit, Trash2, Calendar, 
  DollarSign, User, FileText, CheckCircle2, Clock, X, AlertCircle 
} from 'lucide-react';

interface ProjectManagerProps {
  commissions: Commission[];
  onAddProject: (project: Omit<Commission, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  onEditProject: (id: string, updates: Partial<Commission>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  openQuickAdd?: boolean;
  onCloseQuickAdd?: () => void;
}

export default function ProjectManager({
  commissions,
  onAddProject,
  onEditProject,
  onDeleteProject,
  openQuickAdd,
  onCloseQuickAdd
}: ProjectManagerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>('in_progress');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger modal for editing
  const handleEditClick = (commission: Commission) => {
    setEditingId(commission.id);
    setTitle(commission.title);
    setClientName(commission.clientName);
    setDescription(commission.description);
    setPrice(commission.price);
    setStatus(commission.status);
    setDeadline(commission.deadline);
    setError(null);
    setIsModalOpen(true);
  };

  // Trigger modal for adding
  const handleAddClick = () => {
    setEditingId(null);
    setTitle('');
    setClientName('');
    setDescription('');
    setPrice(0);
    setStatus('in_progress');
    setDeadline('');
    setError(null);
    setIsModalOpen(true);
  };

  // Respond to incoming quick-add triggers from dashboard
  React.useEffect(() => {
    if (openQuickAdd) {
      handleAddClick();
      if (onCloseQuickAdd) onCloseQuickAdd();
    }
  }, [openQuickAdd]);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientName) {
      setError('請填寫專案名稱與委託人');
      return;
    }
    if (price < 0) {
      setError('價格不可小於 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title,
        clientName,
        description,
        price: Number(price),
        status,
        deadline,
      };

      if (editingId) {
        await onEditProject(editingId, payload);
      } else {
        await onAddProject(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setError('儲存失敗，請重試或確認資料格式是否正確');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (window.confirm(`確定要刪除委託專案「${name}」嗎？此操作無法復原。`)) {
      try {
        await onDeleteProject(id);
      } catch (err) {
        alert('刪除失敗');
      }
    }
  };

  // Filter commissions
  const filteredCommissions = commissions.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.clientName.toLowerCase().includes(search.toLowerCase()) ||
                          (c.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            專案委託管理
          </h1>
          <p className="text-sm text-slate-500">
            在此管理您的所有繪圖委託案件、修改進度與設定報價。
          </p>
        </div>
        
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> 建立新委託
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜尋專案名稱、委託人或委託內容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 min-w-[160px]">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 py-2 px-3 text-sm text-slate-700"
          >
            <option value="all">所有狀態</option>
            <option value="pending">待確認 (Pending)</option>
            <option value="in_progress">進行中 (In Progress)</option>
            <option value="completed">已完成 (Completed)</option>
            <option value="cancelled">已取消 (Cancelled)</option>
          </select>
        </div>
      </div>

      {/* Commissions Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCommissions.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            沒有找到符合篩選條件的專案委託
          </div>
        ) : (
          filteredCommissions.map((commission) => {
            const statusConfig = {
              pending: { bg: 'bg-amber-50 text-amber-700 border-amber-100', text: '待確認' },
              in_progress: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', text: '進行中' },
              completed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: '已完成' },
              cancelled: { bg: 'bg-slate-50 text-slate-700 border-slate-100', text: '已取消' },
            }[commission.status];

            return (
              <motion.div
                layout
                key={commission.id}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-xs px-2.5 py-0.5 font-semibold border rounded-full ${statusConfig?.bg}`}>
                      {statusConfig?.text}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(commission)}
                        className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                        title="編輯"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(commission.id, commission.title)}
                        className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-950 text-lg mt-3 truncate">
                    {commission.title}
                  </h3>

                  <div className="space-y-2 mt-4 border-t border-b border-slate-50 py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>委託人：{commission.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-800">
                        價格：${commission.price.toLocaleString()} TWD
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>交件日期：{commission.deadline || '未指定'}</span>
                    </div>
                  </div>

                  {commission.description && (
                    <div className="mt-3">
                      <span className="text-xs font-semibold text-slate-400 block mb-1">委託需求：</span>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {commission.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                  <span className="text-[10px] text-slate-300">
                    建檔日: {commission.createdAt ? new Date(commission.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add / Edit Commission Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? '編輯委託專案' : '新增委託專案'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {error && (
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    專案名稱 *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：夏日海灘風格雙人角色插畫"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      委託人 / 客戶名稱 *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="委託人姓名"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      委託價格 (TWD) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder="金額"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      案件狀態 *
                    </label>
                    <select
                      value={status}
                      onChange={(e: any) => setStatus(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 py-2 px-3 text-sm text-slate-700"
                    >
                      <option value="pending">待確認 (Pending)</option>
                      <option value="in_progress">進行中 (In Progress)</option>
                      <option value="completed">已完成 (Completed)</option>
                      <option value="cancelled">已取消 (Cancelled)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      交件日期 / 截止日
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    委託內容 / 繪圖細節描述
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="請輸入委託詳細內容，包含尺寸、格式（例如 PNG 350dpi）、背景複雜度、參考素材網址等..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
                  >
                    {loading ? '儲存中...' : '確認儲存'}
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
