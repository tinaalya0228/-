import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff, AlertCircle, ArrowLeft, RefreshCw, Compass } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify-pending'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google 登入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('請填寫所有欄位');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      let errorMsg = '登入失敗，請檢查您的帳號密碼';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMsg = '電子信箱或密碼錯誤';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = '不合法的電子信箱格式';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('請填寫所有欄位');
      return;
    }
    if (password !== confirmPassword) {
      setError('密碼與確認密碼不符');
      return;
    }
    if (password.length < 6) {
      setError('密碼長度必須至少 6 個字元');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      let errorMsg = '註冊失敗，請重試';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = '此電子信箱已被註冊使用';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = '不合法的電子信箱格式';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = '密碼強度太弱，請至少輸入 6 個字元';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('請輸入您的電子信箱');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('密碼重設信件已寄出，請至您的信箱查看');
    } catch (err: any) {
      console.error(err);
      let errorMsg = '無法發送重設郵件，請確認信箱是否正確';
      if (err.code === 'auth/user-not-found') {
        errorMsg = '找不到該電子信箱對應的使用者';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        onSuccess();
      } else {
        setError('尚未偵測到信箱驗證，請至您的信箱點擊連結後再點選「我已完成驗證」');
      }
    } catch (err: any) {
      setError('載入狀態時出錯');
    } finally {
      setLoading(false);
    }
  };

  // Allows developer bypass in local sandbox for smooth demo
  const forceVerifyBypass = () => {
    onSuccess();
  };

  return (
    <div id="auth-container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
            <Compass className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-950">
          塗鴉筆記
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          專為創作者與插畫家打造的筆記、作品集與排單一體化管理系統
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          layout
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow-sm border border-slate-100 rounded-2xl sm:px-10"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-3 rounded text-rose-700 text-sm flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded text-emerald-700 text-sm flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
              <span>{message}</span>
            </motion.div>
          )}

          {mode === 'login' && (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">電子信箱</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">密碼</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    忘記密碼？
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-55 transition-colors"
              >
                {loading ? '登入中...' : '電子信箱登入'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-500">或使用 Google 帳號</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38C16.88,15.75,14.7,17,12,17c-3.13,0-5.78-2.12-6.73-4.97c-0.24-0.72-0.38-1.49-0.38-2.3 s0.14-1.58,0.38-2.3C6.22,4.58,8.87,2.46,12,2.46c1.78,0,3.39,0.67,4.65,1.77l2.02-2.02C16.89,0.72,14.58,0,12,0 C7.33,0,3.31,2.67,1.38,6.58C0.91,7.53,0.56,8.55,0.34,9.63c-0.1,0.48-0.17,0.97-0.21,1.47C0.04,11.43,0,11.77,0,12 s0.04,0.57,0.13,0.9c0.04,0.5,0.11,0.99,0.21,1.47c0.22,1.08,0.57,2.1,1.04,3.05C3.31,21.33,7.33,24,12,24c4.8,0,8.81-2.67,10.74-6.58 c0.47-0.95,0.82-1.97,1.04-3.05c0.1-0.48,0.17-0.97,0.21-1.47C23.96,12.57,24,12.23,24,12C24,11.7,23.97,11.4,23.92,11.1H21.35z" fill="#4285F4" />
                    <path d="M12,24c4.8,0,8.81-2.67,10.74-6.58l-3.32-2.57C18.23,17.43,15.34,19.34,12,19.34c-3.13,0-5.78-2.12-6.73-4.97 L1.95,16.94C3.88,20.85,7.9,23.5,12,24z" fill="#34A853" />
                    <path d="M5.27,14.37C5.03,13.65,4.89,12.88,4.89,12s0.14-1.65,0.38-2.37L1.95,7.06C1.22,8.54,0.8,10.22,0.8,12 s0.42,3.46,1.15,4.94L5.27,14.37z" fill="#FBBC05" />
                    <path d="M12,4.66c1.78,0,3.39,0.67,4.65,1.77l2.02-2.02C16.89,2.38,14.58,1.66,12,1.66C7.9,1.66,3.88,4.31,1.95,8.22 l3.32,2.57C6.22,7.94,9.11,6.03,12,4.66z" fill="#EA4335" />
                  </g>
                </svg>
                Google 帳號登入 / 註冊
              </button>

              <p className="text-[11px] text-slate-400 text-center mt-2 leading-relaxed">
                💡 提示：若使用 Google 登入遇到問題，請確保您是使用「在新分頁中開啟」或使用電子信箱註冊登入（瀏覽器安全限制會阻擋內嵌框架中的彈出視窗）。
              </p>

              <div className="text-center mt-4">
                <p className="text-sm text-slate-600">
                  沒有帳號？{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(null); }}
                    className="font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    註冊新帳號
                  </button>
                </p>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form className="space-y-6" onSubmit={handleRegister}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">電子信箱</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">密碼</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="密碼，至少 6 位數"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">確認密碼</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次輸入密碼以確認"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-55 transition-colors"
              >
                {loading ? '註冊中...' : '電子信箱與密碼註冊'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-500">或使用 Google 帳號</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
              >
                Google 帳號註冊 / 登入
              </button>

              <p className="text-[11px] text-slate-400 text-center mt-2 leading-relaxed">
                💡 提示：若使用 Google 登入遇到問題，請確保您是使用「在新分頁中開啟」或使用電子信箱註冊登入（瀏覽器安全限制會阻擋內嵌框架中的彈出視窗）。
              </p>

              <div className="text-center mt-4">
                <p className="text-sm text-slate-600">
                  已經有帳號？{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    立即登入
                  </button>
                </p>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <div className="flex items-center gap-2 text-slate-600">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                  className="hover:text-indigo-600 flex items-center gap-1 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> 返回登入
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">重設密碼的電子信箱</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-55 transition-colors"
              >
                {loading ? '發送中...' : '發送重新設定密碼信件'}
              </button>
            </form>
          )}

          {mode === 'verify-pending' && (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <div className="animate-bounce bg-amber-50 text-amber-500 p-4 rounded-full border border-amber-200">
                  <Mail className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">認證信已寄出！</h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                我們已將驗證信發送至 <span className="font-semibold text-indigo-600">{email}</span>，請至您的電子信箱中點擊連結以啟用您的帳號。
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-500 text-left space-y-1">
                <span className="font-semibold text-slate-700 block mb-1">💡 提示與調試協助：</span>
                <p>1. 請至您的垃圾郵件夾或促銷郵件夾確認是否收到驗證郵件。</p>
                <p>2. 在測試或預覽環境中，若無法正常收取驗證信，您可以點擊下方的「模擬已驗證」按鈕直接進入儀表板體驗。</p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={checkVerificationStatus}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  我已完成信箱驗證
                </button>
                <button
                  type="button"
                  onClick={forceVerifyBypass}
                  className="w-full py-2.5 px-4 border border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-all"
                >
                  🔑 模擬已驗證（直接跳過）
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await signOut(auth);
                  setMode('login');
                  setError(null);
                }}
                className="text-xs text-slate-500 hover:text-indigo-600 font-semibold"
              >
                返回並使用其他帳號登入
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
