import React, { useState } from 'react';
import { Task, Commission } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, Square, Plus, Trash2, Calendar, AlertCircle, 
  X, Search, Filter, Paperclip, Clock, Edit
} from 'lucide-react';

interface TaskManagerProps {
  tasks: Task[];
  commissions: Commission[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  onEditTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleTaskComplete: (id: string, completed: boolean) => Promise<void>;
  openQuickAdd?: boolean;
  onCloseQuickAdd?: () => void;
}

export default function TaskManager({
  tasks,
  commissions,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskComplete,
  openQuickAdd,
  onCloseQuickAdd
}: TaskManagerProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'todo' | 'completed'>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger quick add from Dashboard
  React.useEffect(() => {
    if (openQuickAdd) {
      handleAddClick();
      if (onCloseQuickAdd) onCloseQuickAdd();
    }
  }, [openQuickAdd]);

  const handleAddClick = () => {
    setEditingId(null);
    setTitle('');
    setProjectId('');
    setDueDate('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (task: Task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setProjectId(task.projectId || '');
    setDueDate(task.dueDate || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('請輸入任務標題');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        await onEditTask(editingId, {
          title,
          projectId,
          dueDate
        });
      } else {
        await onAddTask({
          title,
          projectId,
          completed: false,
          dueDate
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setError('儲存任務失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (window.confirm(`確定要刪除任務「${name}」嗎？`)) {
      try {
        await onDeleteTask(id);
      } catch (err) {
        alert('刪除失敗');
      }
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = 
      filter === 'all' ? true : 
      filter === 'todo' ? !t.completed : t.completed;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            任務進度管理
          </h1>
          <p className="text-sm text-slate-500">
            拆解委託工作為子任務，追蹤日常作畫進度。
          </p>
        </div>

        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> 建立新任務
        </button>
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜尋任務標題..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm"
          />
        </div>

        {/* Tab filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('todo')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'todo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            待辦中
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            已完成
          </button>
        </div>
      </div>

      {/* Task List container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            目前尚無符合篩選的任務。建立一個新任務開始規劃您的作畫進度！
          </div>
        ) : (
          filteredTasks.map((task) => {
            // Find linked project
            const linkedProject = commissions.find(c => c.id === task.projectId);

            return (
              <motion.div
                layout
                key={task.id}
                className={`p-4 flex items-center justify-between gap-4 group transition-colors hover:bg-slate-50/60 ${task.completed ? 'bg-slate-50/20' : ''}`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Task checkbox toggle */}
                  <button
                    onClick={() => onToggleTaskComplete(task.id, !task.completed)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5.5 h-5.5 text-indigo-600" />
                    ) : (
                      <Square className="w-5.5 h-5.5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {task.title}
                    </p>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {linkedProject && (
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-md font-bold">
                          <Paperclip className="w-3 h-3" />
                          {linkedProject.title}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          到期日: {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEditClick(task)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                    title="編輯任務"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(task.id, task.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                    title="刪除任務"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? '編輯工作任務' : '新增工作任務'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    任務名稱 / 內容 *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：繪製線稿、上底色、背景細化等..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    關聯委託專案 (選填)
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 py-2 px-3 text-sm text-slate-700"
                  >
                    <option value="">無關聯專案 (獨立任務)</option>
                    {commissions.map((comm) => (
                      <option key={comm.id} value={comm.id}>
                        {comm.title} (委託人: {comm.clientName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    到期日期
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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
