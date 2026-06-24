import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, addDoc 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { Commission, Task, PortfolioItem, Booking, UserProfile } from './types';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import ProjectManager from './components/ProjectManager';
import TaskManager from './components/TaskManager';
import PortfolioManager, { PORTFOLIO_PRESETS } from './components/PortfolioManager';
import ProfileSettings, { DEFAULT_AVATAR } from './components/ProfileSettings';
import PublicProfile from './components/PublicProfile';
import { 
  Briefcase, CheckSquare, Image as ImageIcon, Settings, Compass, 
  LogOut, Menu, X, ExternalLink, Loader2 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'tasks' | 'portfolio' | 'settings'>('dashboard');
  
  // App data state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick-Add flags
  const [triggerQuickAddProject, setTriggerQuickAddProject] = useState(false);
  const [triggerQuickAddTask, setTriggerQuickAddTask] = useState(false);

  // Public/Shared Profile View States
  const [isPublicView, setIsPublicView] = useState(false);
  const [publicFreelancerId, setPublicFreelancerId] = useState<string | null>(null);
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [publicPortfolio, setPublicPortfolio] = useState<PortfolioItem[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);

  // 1. Detect public freelancer share links (?freelancer=UID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const freelancerId = params.get('freelancer');
    if (freelancerId) {
      setIsPublicView(true);
      setPublicFreelancerId(freelancerId);
      loadPublicProfile(freelancerId);
    } else {
      setIsPublicView(false);
      setPublicFreelancerId(null);
    }
  }, []);

  // Fetch target public profile for visitor
  const loadPublicProfile = async (uid: string) => {
    setPublicLoading(true);
    setPublicError(null);
    try {
      const userDocRef = doc(db, 'users', uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setPublicProfile({
          uid,
          displayName: userData.displayName || '未命名繪師',
          bio: userData.bio || '',
          avatarUrl: userData.avatarUrl || DEFAULT_AVATAR,
          socialLinks: userData.socialLinks ? JSON.parse(userData.socialLinks) : {},
          portfolioVisible: userData.portfolioVisible !== false
        });

        // Fetch visible portfolio items
        const portfolioQuery = query(
          collection(db, 'portfolio'), 
          where('userId', '==', uid),
          where('visible', '==', true)
        );
        const portfolioSnapshot = await getDocs(portfolioQuery);
        const items: PortfolioItem[] = [];
        portfolioSnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            userId: d.userId,
            title: d.title,
            imageUrl: d.imageUrl,
            description: d.description || '',
            visible: d.visible,
            createdAt: d.createdAt || ''
          });
        });
        setPublicPortfolio(items);
      } else {
        setPublicError('找不到此繪師的個人檔案');
      }
    } catch (err) {
      console.error(err);
      setPublicError('載入繪師個人檔案時發生錯誤');
    } finally {
      setPublicLoading(false);
    }
  };

  // Submit client booking via public link
  const handleSubmitBooking = async (bookingData: {
    clientName: string;
    clientEmail: string;
    title: string;
    description: string;
    budget: number;
  }) => {
    if (!publicFreelancerId) return;
    const path = 'bookings';
    try {
      await addDoc(collection(db, path), {
        freelancerId: publicFreelancerId,
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        title: bookingData.title,
        description: bookingData.description,
        budget: bookingData.budget,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // 2. Standard authenticated freelancer workflow
  useEffect(() => {
    if (isPublicView) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await ensureUserProfile(currentUser);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isPublicView]);

  // Ensure current logged-in user has profile document
  const ensureUserProfile = async (currentUser: FirebaseUser) => {
    const path = `users/${currentUser.uid}`;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const initialProfile = {
          displayName: currentUser.displayName || '新插畫家',
          bio: '您好！我是自由插畫家。',
          avatarUrl: DEFAULT_AVATAR,
          socialLinks: JSON.stringify({ email: currentUser.email || '' }),
          portfolioVisible: true
        };
        await setDoc(userRef, initialProfile);
        setProfile({
          uid: currentUser.uid,
          ...initialProfile,
          socialLinks: { email: currentUser.email || '' }
        });
      } else {
        const d = userSnap.data();
        setProfile({
          uid: currentUser.uid,
          displayName: d.displayName || '新插畫家',
          bio: d.bio || '',
          avatarUrl: d.avatarUrl || DEFAULT_AVATAR,
          socialLinks: d.socialLinks ? JSON.parse(d.socialLinks) : {},
          portfolioVisible: d.portfolioVisible !== false
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  };

  // 3. Real-time synchronizations for authenticated user
  useEffect(() => {
    if (!user) return;

    // Sync commissions
    const commissionsQuery = query(collection(db, 'commissions'), where('userId', '==', user.uid));
    const unsubCommissions = onSnapshot(commissionsQuery, (snapshot) => {
      const list: Commission[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: data.userId,
          title: data.title,
          clientName: data.clientName,
          description: data.description || '',
          price: data.price || 0,
          status: data.status,
          deadline: data.deadline || '',
          createdAt: data.createdAt || ''
        });
      });
      setCommissions(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'commissions');
    });

    // Sync tasks
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const list: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: data.userId,
          projectId: data.projectId || '',
          title: data.title,
          completed: data.completed || false,
          dueDate: data.dueDate || '',
          createdAt: data.createdAt || ''
        });
      });
      setTasks(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'tasks');
    });

    // Sync portfolio
    const portfolioQuery = query(collection(db, 'portfolio'), where('userId', '==', user.uid));
    const unsubPortfolio = onSnapshot(portfolioQuery, (snapshot) => {
      const list: PortfolioItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: data.userId,
          title: data.title,
          imageUrl: data.imageUrl,
          description: data.description || '',
          visible: data.visible !== false,
          createdAt: data.createdAt || ''
        });
      });
      setPortfolio(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'portfolio');
    });

    // Sync bookings
    const bookingsQuery = query(collection(db, 'bookings'), where('freelancerId', '==', user.uid));
    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          freelancerId: data.freelancerId,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          title: data.title,
          description: data.description || '',
          budget: data.budget || 0,
          status: data.status,
          createdAt: data.createdAt || ''
        });
      });
      setBookings(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'bookings');
    });

    return () => {
      unsubCommissions();
      unsubTasks();
      unsubPortfolio();
      unsubBookings();
    };
  }, [user]);

  // 4. Data Operations Handlers
  const handleAddProject = async (proj: Omit<Commission, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const path = 'commissions';
    try {
      await addDoc(collection(db, path), {
        ...proj,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleEditProject = async (id: string, updates: Partial<Commission>) => {
    const path = `commissions/${id}`;
    try {
      await updateDoc(doc(db, 'commissions', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteProject = async (id: string) => {
    const path = `commissions/${id}`;
    try {
      await deleteDoc(doc(db, 'commissions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleAddTask = async (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const path = 'tasks';
    try {
      await addDoc(collection(db, path), {
        ...task,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleEditTask = async (id: string, updates: Partial<Task>) => {
    const path = `tasks/${id}`;
    try {
      await updateDoc(doc(db, 'tasks', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const path = `tasks/${id}`;
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleToggleTaskComplete = async (id: string, completed: boolean) => {
    const path = `tasks/${id}`;
    try {
      await updateDoc(doc(db, 'tasks', id), { completed });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAddPortfolioItem = async (item: Omit<PortfolioItem, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const path = 'portfolio';
    try {
      await addDoc(collection(db, path), {
        ...item,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeletePortfolioItem = async (id: string) => {
    const path = `portfolio/${id}`;
    try {
      await deleteDoc(doc(db, 'portfolio', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleTogglePortfolioItemVisibility = async (id: string, visible: boolean) => {
    const path = `portfolio/${id}`;
    try {
      await updateDoc(doc(db, 'portfolio', id), { visible });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      const dbPayload = {
        displayName: updates.displayName,
        bio: updates.bio || '',
        avatarUrl: updates.avatarUrl || DEFAULT_AVATAR,
        portfolioVisible: updates.portfolioVisible !== false,
        socialLinks: JSON.stringify(updates.socialLinks || {})
      };
      await updateDoc(doc(db, 'users', user.uid), dbPayload);
      setProfile({
        uid: user.uid,
        ...updates
      } as UserProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Convert incoming Booking request into a Commission Project
  const handleAcceptBooking = async (booking: Booking) => {
    if (!user) return;
    try {
      // 1. Update Booking status to accepted
      await updateDoc(doc(db, 'bookings', booking.id), { status: 'accepted' });
      
      // 2. Create Commission Project
      await handleAddProject({
        title: booking.title,
        clientName: booking.clientName,
        description: `客戶預訂說明:\n${booking.description}\n\n聯絡信箱: ${booking.clientEmail}`,
        price: booking.budget,
        status: 'pending',
        deadline: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineBooking = async (id: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status: 'declined' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setProfile(null);
    } catch (err) {
      console.error('登出時發生錯誤：', err);
    }
  };

  // 5. Render Loading Spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm text-slate-500 font-semibold font-sans">正在與伺服器安全連線...</span>
      </div>
    );
  }

  // 6. Render Public Share Profile
  if (isPublicView) {
    if (publicLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-sm text-slate-500 font-sans">正在載入公開作品集與簡介...</span>
        </div>
      );
    }

    if (publicError || !publicProfile) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-sans text-center">
          <div className="text-rose-500 font-bold text-lg">{publicError || '無法載入個人主頁'}</div>
          <p className="text-sm text-slate-400 mt-2">請確認您的連結是否正確，或此繪師已變更連結。</p>
        </div>
      );
    }

    return (
      <PublicProfile 
        profile={publicProfile}
        portfolio={publicPortfolio}
        onSubmitBooking={handleSubmitBooking}
      />
    );
  }

  // 7. Render Authentication Screen
  if (!user) {
    return <AuthScreen onSuccess={() => {}} />;
  }

  // 8. Render Private Management Dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Banner Header */}
      <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-950">塗鴉筆記</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold rounded px-1.5 py-0.5 ml-2">
                創作工作台
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Creator Info Card */}
            {profile && (
              <div className="hidden sm:flex items-center gap-2 border border-slate-100 rounded-full py-1 pl-1 pr-3 bg-slate-50">
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                />
                <span className="text-xs font-bold text-slate-700">{profile.displayName}</span>
              </div>
            )}

            {/* View Shared Portfolio Button */}
            {profile && (
              <a
                href={`?freelancer=${profile.uid}`}
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 py-1.5 px-3 rounded-lg border border-indigo-200 transition-colors"
              >
                <span>瀏覽我的分享網頁</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-slate-50 text-slate-500 rounded-xl sm:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main layout wrapper */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col sm:flex-row gap-0 sm:gap-6 p-4 sm:p-6">
        
        {/* Navigation Sidebar (Desktop) */}
        <aside className="hidden sm:block w-52 shrink-0 space-y-6">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" /> 儀表板首頁
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'projects' 
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4" /> 委託專案
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tasks' 
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4" /> 任務進度
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'portfolio' 
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> 作品集
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" /> 個人設定與預訂
            </button>
          </nav>

          <div className="pt-6 border-t border-slate-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> 登出工作台
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-30 sm:hidden">
            <div className="bg-white w-64 h-full p-6 space-y-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-indigo-950 text-sm">功能導覽</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  <button
                    onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    <Compass className="w-4 h-4" /> 儀表板首頁
                  </button>
                  <button
                    onClick={() => { setActiveTab('projects'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" /> 委託專案
                  </button>
                  <button
                    onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" /> 任務進度
                  </button>
                  <button
                    onClick={() => { setActiveTab('portfolio'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'portfolio' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" /> 作品集
                  </button>
                  <button
                    onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    <Settings className="w-4 h-4" /> 個人設定與預訂
                  </button>
                </nav>
              </div>

              <div className="space-y-4">
                {profile && (
                  <a
                    href={`?freelancer=${profile.uid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/50 py-2.5 rounded-xl border border-indigo-200 transition-colors"
                  >
                    <span>瀏覽分享主頁</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" /> 登出系統
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Panel Content area */}
        <main className="flex-1 min-w-0 bg-white sm:bg-transparent rounded-3xl p-0 sm:p-0">
          {activeTab === 'dashboard' && (
            <Dashboard 
              commissions={commissions}
              tasks={tasks}
              onNavigate={(view) => setActiveTab(view)}
              onQuickAddProject={() => { setActiveTab('projects'); setTriggerQuickAddProject(true); }}
              onQuickAddTask={() => { setActiveTab('tasks'); setTriggerQuickAddTask(true); }}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectManager 
              commissions={commissions}
              onAddProject={handleAddProject}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
              openQuickAdd={triggerQuickAddProject}
              onCloseQuickAdd={() => setTriggerQuickAddProject(false)}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskManager 
              tasks={tasks}
              commissions={commissions}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              openQuickAdd={triggerQuickAddTask}
              onCloseQuickAdd={() => setTriggerQuickAddTask(false)}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioManager 
              portfolio={portfolio}
              commissions={commissions}
              onAddPortfolioItem={handleAddPortfolioItem}
              onDeletePortfolioItem={handleDeletePortfolioItem}
              onTogglePortfolioItemVisibility={handleTogglePortfolioItemVisibility}
            />
          )}

          {activeTab === 'settings' && (
            <ProfileSettings 
              profile={profile}
              bookings={bookings}
              onSaveProfile={handleSaveProfile}
              onAcceptBooking={handleAcceptBooking}
              onDeclineBooking={handleDeclineBooking}
              onDeleteBooking={handleDeleteBooking}
            />
          )}
        </main>

      </div>
    </div>
  );
}
