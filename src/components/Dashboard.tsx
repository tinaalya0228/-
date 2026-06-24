import React from 'react';
import { Commission, Task } from '../types';
import { motion } from 'motion/react';
import { Briefcase, Users, CheckSquare, Plus, ArrowRight, DollarSign, Calendar, Clock } from 'lucide-react';

interface DashboardProps {
  commissions: Commission[];
  tasks: Task[];
  onNavigate: (view: 'dashboard' | 'projects' | 'tasks' | 'portfolio' | 'settings') => void;
  onQuickAddProject: () => void;
  onQuickAddTask: () => void;
}

export default function Dashboard({
  commissions,
  tasks,
  onNavigate,
  onQuickAddProject,
  onQuickAddTask
}: DashboardProps) {
  // Compute metrics
  const activeProjects = commissions.filter(c => c.status === 'in_progress').length;
  const completedProjects = commissions.filter(c => c.status === 'completed').length;
  const pendingProjects = commissions.filter(c => c.status === 'pending').length;
  
  // Unique clients count
  const clients = Array.from(new Set(commissions.map(c => c.clientName.trim().toLowerCase()))).filter(Boolean).length;
  
  // Tasks count
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;

  // Recent commissions
  const recentCommissions = [...commissions]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 3);

  // Recent tasks
  const recentTasks = [...tasks]
    .filter(t => !t.completed)
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8 font-sans">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
            委託管理儀表板
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            今天也是創作的美好一天！隨時追蹤您的專案與任務。
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onQuickAddProject}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 新增委託專案
          </button>
          <button
            onClick={onQuickAddTask}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 新增工作任務
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total/Active Projects */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">進行中專案 / 總專案</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900">{activeProjects}</span>
              <span className="text-xs text-slate-400">/ {commissions.length} 個</span>
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Clients */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">合作委託客戶</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900">{clients}</span>
              <span className="text-xs text-slate-400">位聯絡人</span>
            </div>
          </div>
        </motion.div>

        {/* Metric 3: Active Tasks */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">未完成 / 總工作任務</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900">{pendingTasks}</span>
              <span className="text-xs text-slate-400">/ {totalTasks} 項</span>
            </div>
          </div>
        </motion.div>

        {/* Metric 4: Estimated Revenue */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">已完成委託總金額</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900">
                ${commissions.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.price, 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">TWD</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Sections: Project Overview & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols width on large screen): Recent Commissions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <Briefcase className="w-5 h-5 text-indigo-500" />
              最新專案委託
            </h2>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              看全部 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentCommissions.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <p className="text-sm text-slate-400">目前尚無專案委託</p>
                <button
                  onClick={onQuickAddProject}
                  className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                >
                  立即建立第一個專案 <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              recentCommissions.map((commission) => {
                const statusConfig = {
                  pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: '待確認' },
                  in_progress: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: '進行中' },
                  completed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: '已完成' },
                  cancelled: { bg: 'bg-slate-50 text-slate-700 border-slate-200', text: '已取消' },
                }[commission.status];

                return (
                  <div
                    key={commission.id}
                    className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-slate-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2.5 py-0.5 font-medium border rounded-full ${statusConfig?.bg}`}>
                          {statusConfig?.text}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">委託人: {commission.clientName}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{commission.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{commission.description || '無詳細說明'}</p>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-start w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-sm font-extrabold text-slate-900">
                        ${commission.price.toLocaleString()} TWD
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>截止: {commission.deadline || '無期限'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (1 col width on large screen): Pending Tasks */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              待辦工作項目
            </h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              看全部 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            {recentTasks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400">目前沒有待辦的任務</p>
                <button
                  onClick={onQuickAddTask}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5"
                >
                  新增任務 <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTasks.map((task) => (
                  <div key={task.id} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
                    <div className="mt-0.5 p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>到期日: {task.dueDate}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
