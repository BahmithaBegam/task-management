import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [session, setSession] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Navigation state: 'home', 'features', 'about', 'crud'
  const [currentView, setCurrentView] = useState('home');


  // Task states (CRUD)
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchTasks();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchTasks();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [session, isSignUp, tasks, currentView]);

  // Read Tasks
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setTasks(data || []);
  };

  // Create or Update Task
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (editingId) {
      const { error } = await supabase
        .from('tasks')
        .update({ title: taskTitle, description: taskDesc })
        .eq('id', editingId);

      if (error) {
        alert(error.message);
      } else {
        setEditingId(null);
        setTaskTitle('');
        setTaskDesc('');
        fetchTasks();
      }
    } else {
      const { error } = await supabase.from('tasks').insert([
        { title: taskTitle, description: taskDesc, user_id: session?.user?.id }
      ]);

      if (error) {
        alert(error.message);
      } else {
        setTaskTitle('');
        setTaskDesc('');
        fetchTasks();
      }
    }
  };

  const handleEditClick = (task) => {
    setEditingId(task.id);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
  };

  const handleDeleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) fetchTasks();
  };

  // Auth Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) {
          if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;
            setSession(signInData.session);
            setCurrentView('crud');
          } else {
            throw error;
          }
        } else if (data?.session) {
          setSession(data.session);
          setCurrentView('crud');
        } else {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          setSession(signInData.session);
          setCurrentView('crud');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session);
        setCurrentView('crud');
      }
    } catch (error) {
      alert(error.message || 'Authentication failed!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      alert(error.message || 'Google login failed!');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setTasks([]);
    setCurrentView('home');
  };

  // ==================== CRUD DASHBOARD VIEW ====================
  if (session && currentView === 'crud') {
    return (
      <div className="min-h-screen lg:h-screen w-screen overflow-y-auto lg:overflow-hidden bg-gradient-to-br from-[#bfdbfe] via-[#3b82f6] to-[#1d4ed8] px-4 py-3 lg:p-6 flex flex-col justify-between select-none">
        <header className="max-w-6xl mx-auto w-full h-12 lg:h-14 flex items-center justify-between bg-white/85 backdrop-blur-md px-6 rounded-3xl shadow-[0_10px_30px_rgba(30,64,175,0.2)] border border-blue-300/80 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('home')}
              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
              title="Back to Home"
            >
              <i data-lucide="arrow-left" className="w-5 h-5"></i>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-md">
                <i data-lucide="check" className="w-4 h-4 stroke-[3]"></i>
              </div>
              <span className="text-lg font-bold text-gray-900">TaskFlow Workspace</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <i data-lucide="log-out" className="w-3.5 h-3.5"></i> Sign Out
          </button>
        </header>

        <main className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-center py-2 relative">
          <div className="w-full flex items-center justify-between mb-3">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              Dashboard & CRUD Operations
            </h1>
          </div>

          <div className="w-full lg:h-[74vh] grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-[0_20px_50px_rgba(30,64,175,0.25)] border-2 border-blue-500/70 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                  <i data-lucide={editingId ? "edit" : "plus-circle"} className="w-4 h-4 text-blue-600"></i>
                  {editingId ? 'Edit Task (Update)' : 'Add Task (Create)'}
                </h3>
              </div>
              <form onSubmit={handleSaveTask} className="space-y-4 flex-grow flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-1">Task Title</label>
                    <input
                      type="text"
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full px-3.5 py-2.5 bg-blue-50/90 border-2 border-blue-300 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-1">Description</label>
                    <textarea
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder="Add details..."
                      className="w-full px-3.5 py-2.5 bg-blue-50/90 border-2 border-blue-300 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 h-32 lg:h-44 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 hover:from-blue-700 transition-all cursor-pointer">
                    {editingId ? 'Update Task' : 'Add Task'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setTaskTitle(''); setTaskDesc(''); }}
                      className="px-4 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="md:col-span-2 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-[0_20px_50px_rgba(30,64,175,0.25)] border-2 border-blue-500/70 flex flex-col h-full overflow-hidden">
              <h3 className="text-base font-extrabold text-gray-900 mb-3 flex items-center gap-2 shrink-0">
                <i data-lucide="list-todo" className="w-4 h-4 text-blue-600"></i> TASK LIST (CRUD) ({tasks.length})
              </h3>
              
              <div className="space-y-3 overflow-y-auto flex-grow pr-1">
                {tasks.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-12">No tasks yet. Create one to get started!</p>
                ) : (
                  tasks.map((task) => {
                    const formattedDate = task.created_at
                      ? new Date(task.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                      : '';
                    return (
                      <div key={task.id} className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 backdrop-blur-sm border-2 border-blue-300/90 rounded-2xl flex items-start justify-between gap-4 shadow-sm hover:border-blue-500 transition-all">
                        <div>
                          <h4 className="text-sm font-extrabold text-gray-900">{task.title}</h4>
                          <p className="text-xs text-gray-700 mt-1">{task.description}</p>
                          <span className="text-[10px] text-blue-700 font-bold mt-2 flex items-center gap-1">
                            <i data-lucide="clock" className="w-3 h-3"></i> {formattedDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditClick(task)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <i data-lucide="pencil" className="w-4 h-4"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <i data-lucide="trash-2" className="w-4 h-4"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==================== FEATURES PAGE VIEW ====================
  if (currentView === 'features') {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-[#bfdbfe] via-[#3b82f6] to-[#1d4ed8] px-4 py-6 flex flex-col justify-between select-none">
        <header className="max-w-6xl mx-auto w-full h-14 flex items-center justify-between bg-white/85 backdrop-blur-md px-6 rounded-3xl shadow-md">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <i data-lucide="arrow-left" className="w-4 h-4"></i> Back to Home
          </button>
          <span className="text-base font-extrabold text-gray-900">TASKFLOW FEATURES</span>
          <button
            onClick={() => {
              if (session) setCurrentView('crud');
              else setIsSignUp(true);
              if (!session) setCurrentView('home');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
          >
            Sign In
          </button>
        </header>

        <main className="max-w-5xl mx-auto py-8 text-center space-y-6">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white drop-shadow">Explore Core App Capabilities</h1>
          <p className="text-sm text-blue-100 max-w-xl mx-auto">Discover how TaskFlow uses full database persistence to manage your tasks effortlessly.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left pt-4">
            <div className="bg-white/90 p-5 rounded-2xl shadow-md border border-blue-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">C</div>
              <h3 className="font-bold text-gray-900 text-sm">Create Tasks</h3>
              <p className="text-xs text-gray-600">Instantly insert new checklist items with custom descriptions into your storage securely.</p>
            </div>
            <div className="bg-white/90 p-5 rounded-2xl shadow-md border border-blue-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">R</div>
              <h3 className="font-bold text-gray-900 text-sm">Read & Fetch</h3>
              <p className="text-xs text-gray-600">View real-time organized logs of everything you need to accomplish ordered by newest first.</p>
            </div>
            <div className="bg-white/90 p-5 rounded-2xl shadow-md border border-blue-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">U</div>
              <h3 className="font-bold text-gray-900 text-sm">Update Details</h3>
              <p className="text-xs text-gray-600">Modify existing item attributes on-the-fly whenever your project scope changes.</p>
            </div>
            <div className="bg-white/90 p-5 rounded-2xl shadow-md border border-blue-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">D</div>
              <h3 className="font-bold text-gray-900 text-sm">Delete Records</h3>
              <p className="text-xs text-gray-600">Clean up completed or obsolete tasks from your record pool permanently with one click.</p>
            </div>
          </div>
        </main>
        <footer className="text-center text-xs text-blue-100 pb-2">TaskFlow &copy; 2026</footer>
      </div>
    );
  }

  // ==================== ABOUT PAGE VIEW ====================
  // ... (Your previous imports remain the same)

// Logic to navigate
const navigateTo = (view) => {
  setCurrentView(view);
};

// ==================== ABOUT PAGE VIEW (FIXED) ====================
if (currentView === 'about') {
  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-[#bfdbfe] via-[#3b82f6] to-[#1d4ed8] px-4 py-6 flex flex-col justify-between select-none">
      <header className="max-w-6xl mx-auto w-full h-14 flex items-center justify-between bg-white/85 backdrop-blur-md px-6 rounded-3xl shadow-[0_10px_30px_rgba(30,64,175,0.2)] border border-blue-300">
        {/* FIXED: Explicitly calling navigateTo('home') */}
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <i data-lucide="arrow-left" className="w-4 h-4"></i> Back to Home
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <i data-lucide="info" className="w-3.5 h-3.5"></i>
          </div>
          <span className="text-base font-extrabold text-gray-900">TASKFLOW ABOUT</span>
        </div>

        {session ? (
          <button
            type="button"
            onClick={() => navigateTo('crud')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
          >
            Go to Workspace &rarr;
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setIsSignUp(false); navigateTo('home'); }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
          >
            Sign In
          </button>
        )}
      </header>

      {/* About Content remains same */}
      <main className="max-w-4xl mx-auto py-8 text-center space-y-6">
        
        <h1 className="text-3xl font-extrabold text-white">Empowering Daily Productivity</h1>
        <p className="text-sm text-blue-100">TaskFlow was engineered to make task management clean and intuitive.</p>
        <div className="inline-flex p-3 bg-white/80 rounded-2xl shadow-sm text-blue-600 mb-1">
          <i data-lucide="info" className="w-8 h-8"></i>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-4">
          <div className="bg-white/90 p-5 rounded-2xl shadow-md border border-blue-200 space-y-2">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <i data-lucide="shield-check" className="w-4 h-4 text-blue-600"></i> Secure & Reliable
            </h3>
            <p className="text-xs text-gray-600">Built using modern cloud database standards and authentication layers, ensuring your personal workspace data remains private and secure.</p>
          </div>
          <div className="bg-white/90 p-5 rounded-2xl shadow-md border border-blue-200 space-y-2">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <i data-lucide="zap" className="w-4 h-4 text-blue-600"></i> Fast & Responsive
            </h3>
            <p className="text-xs text-gray-600">Designed with a fluid glassmorphic UI layout that adapts seamlessly across all mobile, tablet, and desktop viewports.</p>
          </div>
        <div className="bg-white/90 p-5 rounded-2xl shadow-md border border-blue-200 space-y-2">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <i data-lucide="layers" className="w-4 h-4 text-blue-600"></i> Modular Workflow
            </h3>
            <p className="text-xs text-gray-600">Complete control over your project tasks with immediate synchronization between form submissions and live database records.</p>
          </div>
        </div>
      </main>
      </div>
    
  );
}

  // ==================== HOME / LANDING PAGE VIEW ====================
  return (
    <div className="min-h-screen lg:h-screen w-screen overflow-y-auto lg:overflow-hidden flex flex-col justify-between bg-gradient-to-br from-[#bfdbfe] via-[#3b82f6] to-[#1d4ed8] px-3 sm:px-6 py-2 select-none">
      <header className="w-full max-w-7xl mx-auto h-12 lg:h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentView('home')}>
          <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/35">
            <i data-lucide="check" className="w-4 h-4 text-white stroke-[3]"></i>
          </div>
          <span className="text-base lg:text-lg font-bold tracking-tight text-white drop-shadow-sm">TaskFlow</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-base font-bold text-white drop-shadow-sm">
          <button onClick={() => setCurrentView('home')} className="text-cyan-200 border-b-2 border-cyan-200 pb-0.5 bg-transparent cursor-pointer">Home</button>
          <button onClick={() => setCurrentView('features')} className="hover:text-cyan-200 transition-colors bg-transparent border-none cursor-pointer text-white font-bold text-base">Features</button>
          <button onClick={() => setCurrentView('about')} className="hover:text-cyan-200 transition-colors bg-transparent border-none cursor-pointer text-white font-bold text-base">About</button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSignUp(false)}
            className="hidden sm:inline-flex px-4 py-1.5 text-sm font-bold text-white hover:text-cyan-200 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className="px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 rounded-full shadow-md shadow-blue-900/30 transition-all cursor-pointer border border-blue-400/50"
          >
            Get Started &rarr;
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-1 lg:py-2 relative">
        <div className="w-full max-w-6xl h-auto lg:h-[81vh] bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(30,64,175,0.3)] border border-blue-300/80 ring-2 ring-blue-500/20 overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative z-10">
          
          <div className="bg-gradient-to-b from-[#eff6ff]/95 to-[#dbeafe]/90 backdrop-blur-sm p-6 lg:p-10 flex flex-col justify-between relative overflow-hidden border-r border-blue-200/80">
            <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-blue-400/30 rounded-full blur-2xl pointer-events-none"></div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-blue-300 rounded-xl shadow-sm mb-3 lg:mb-4">
                <div className="w-6 h-6 lg:w-7 lg:h-7 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
                  <i data-lucide="check" className="w-3.5 h-3.5 text-white stroke-[3]"></i>
                </div>
                <span className="text-xs lg:text-sm font-bold tracking-tight text-gray-900">TaskFlow Workspace</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-2 lg:mb-3">
                Organize Your Work, <span className="text-blue-600">Achieve More.</span>
              </h1>
              <p className="text-gray-700 text-xs lg:text-sm leading-relaxed max-w-md mb-2">
                A simple and powerful task management app featuring complete CRUD operations to keep you focused and productive.
              </p>
            </div>

            <div className="flex gap-2 my-2">
              <div 
                onClick={() => setCurrentView('features')}
                className="cursor-pointer group flex-1"
              >
                <div className="bg-white/90 backdrop-blur-md border border-blue-300 group-hover:border-blue-500 rounded-2xl p-3 shadow-md flex items-center justify-between transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-sm">
                      <i data-lucide="sparkles" className="w-3.5 h-3.5"></i>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-gray-900 group-hover:text-blue-600">Features &rarr;</h4>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setCurrentView('about')}
                className="cursor-pointer group flex-1"
              >
                <div className="bg-white/90 backdrop-blur-md border border-blue-300 group-hover:border-blue-500 rounded-2xl p-3 shadow-md flex items-center justify-between transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                      <i data-lucide="info" className="w-3.5 h-3.5"></i>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-gray-900 group-hover:text-blue-600">About Us &rarr;</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-blue-300 space-y-2.5 w-full">
                <div className="flex items-center pb-2 border-b border-blue-200">
                  <h4 className="text-[11px] font-extrabold text-gray-900 flex items-center gap-1.5">
                    <i data-lucide="list-todo" className="w-3.5 h-3.5 text-blue-600"></i> Priority Tasks
                  </h4>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px]">
                    <i data-lucide="check" className="w-2.5 h-2.5 stroke-[3]"></i>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full w-28"></div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px]">
                    <i data-lucide="check" className="w-2.5 h-2.5 stroke-[3]"></i>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full w-32"></div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-blue-300 text-center space-y-2 w-full">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute w-5 h-5 bg-blue-500 rounded-full -top-1 animate-pulse shadow-sm"></div>
                  <div className="absolute w-5 h-5 bg-indigo-600 rounded-full -bottom-1 shadow-sm"></div>
                  <div className="absolute w-5 h-5 bg-blue-600 rounded-full -left-1 shadow-sm"></div>
                  <div className="absolute w-5 h-5 bg-indigo-500 rounded-full -right-1 shadow-sm"></div>
                  <div className="relative w-4 h-4 bg-cyan-400 rounded-full shadow-inner flex items-center justify-center z-10">
                    <div className="w-1 h-1 bg-blue-800 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-gray-900 tracking-wide">Bloom & Grow</h4>
                  <p className="text-[9px] text-gray-500">Daily Milestone Tracker</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-white/90 to-[#f0f9ff]/90 backdrop-blur-md p-6 lg:p-10 flex flex-col justify-center">
            <div className="max-w-sm w-full mx-auto">
             
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-blue-300 shadow-sm text-center mb-4 lg:mb-5">
                <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900 tracking-tight">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-xs lg:text-sm text-gray-500 mt-0.5">
                  {isSignUp ? 'Sign up to access the CRUD task workspace' : 'Sign in to your TaskFlow account'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-1">Email</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <i data-lucide="mail" className="w-4 h-4"></i>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="block w-full pl-10 pr-4 py-2.5 bg-blue-50/70 border border-blue-300 rounded-xl text-xs lg:text-sm placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-900">Password</label>
                    {!isSignUp && (
                      <a href="#" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</a>
                    )}
                  </div>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <i data-lucide="lock" className="w-4 h-4"></i>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="block w-full pl-10 pr-10 py-2.5 bg-blue-50/70 border border-blue-300 rounded-xl text-xs lg:text-sm placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
                      <i data-lucide={showPassword ? "eye" : "eye-off"} className="w-4 h-4"></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group text-xs lg:text-sm cursor-pointer"
                >
                  <span>{loading ? 'Processing...' : (isSignUp ? 'Sign Up & Open Workspace' : 'Sign In & Open Workspace')}</span>
                  <i data-lucide="arrow-right" className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"></i>
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-blue-300"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-gray-500 font-bold">or</span></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 bg-white/90 backdrop-blur-md border border-blue-300 hover:bg-blue-50 text-gray-700 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="text-xs lg:text-sm font-bold text-gray-700">Continue with Google</span>
              </button>

              <p className="text-center text-xs text-gray-600 mt-4">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors ml-1 cursor-pointer"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
