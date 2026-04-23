import React, { useState } from 'react';
import { Search, Loader2, Mail, LogIn, Layers, MessageSquare, ExternalLink, LogOut, ChevronDown, ChevronUp, Sparkles, Shield, Zap } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

function App() {
  const [searchWord, setSearchWord] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);

  const exportToCSV = (group) => {
    const headers = ['From', 'Date', 'Snippet', 'Link'];
    const rows = group.emails.map(email => [
      email.from,
      new Date(email.date).toLocaleString(),
      `"${email.snippet.replace(/"/g, '""')}"`,
      `https://mail.google.com/mail/u/0/#inbox/${email.id}`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${group.context.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_emails.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      setToken(response.access_token);
      try {
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` }
        });
        setUser(userInfo.data);
      } catch (err) {
        console.error('Failed to get user info', err);
      }
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.profile',
  });

  const startScraping = async (e) => {
    if (e) e.preventDefault();
    if (!token) return;

    setIsScraping(true);
    setGroups([]);
    setError(null);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/gmail/scrape`, {
        token,
        searchWord
      });
      if (response.data.success) {
        setGroups(response.data.groups);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsScraping(false);
    }
  };

  const toggleGroup = (index) => {
    setExpandedGroups(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen text-slate-100 selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center animate-glow">
              <Layers className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              EmailScraper
            </span>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <img src={user.picture} alt="User" className="w-6 h-6 rounded-full" />
                <span className="text-sm font-medium text-slate-300">{user.name}</span>
              </div>
              <button 
                onClick={() => { setUser(null); setToken(null); setGroups([]); }}
                className="p-2 rounded-full hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center max-w-3xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold flex items-center gap-2"
              >
                <Sparkles size={14} />
                Now with AI-powered grouping
              </motion.div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
                Organize your inbox <br />
                <span className="text-indigo-500">with intelligence.</span>
              </h1>
              
              <p className="text-lg text-slate-400 mb-10 max-w-xl">
                The most advanced email scraping and categorization tool. 
                Connect your Gmail and see your messages organized by context instantly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center mb-16">
                <button 
                  onClick={() => login()} 
                  className="group relative px-8 py-4 bg-indigo-600 rounded-2xl font-bold text-white flex items-center gap-3 transition-all hover:bg-indigo-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                >
                  <LogIn size={20} />
                  Get Started with Google
                </button>
                <div className="flex items-center gap-6 text-slate-500 text-sm font-medium">
                  <div className="flex items-center gap-2"><Shield size={16} /> Secure</div>
                  <div className="flex items-center gap-2"><Zap size={16} /> Fast</div>
                </div>
              </div>

              {/* Feature grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
                {[
                  { icon: <Layers className="text-indigo-400" />, title: "Smart Grouping", desc: "Automatically groups related emails by context and subject." },
                  { icon: <MessageSquare className="text-emerald-400" />, title: "Context Aware", desc: "Strips away prefixes like Re: and Fwd: for cleaner lists." },
                  { icon: <Search className="text-amber-400" />, title: "Deep Search", desc: "Find exactly what you need with advanced filtering options." }
                ].map((f, i) => (
                  <div key={i} className="glass p-6 rounded-2xl border-white/5 hover:border-white/10 transition-colors">
                    <div className="mb-4">{f.icon}</div>
                    <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {/* Search Section */}
              <div className="glass p-8 rounded-3xl border-white/5 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Search size={24} className="text-indigo-400" />
                  Search & Scrape
                </h2>
                <form onSubmit={startScraping} className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter search keywords..."
                      value={searchWord}
                      onChange={(e) => setSearchWord(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isScraping} 
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:scale-100 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    {isScraping ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    {isScraping ? 'Scraping...' : 'Scrape Emails'}
                  </button>
                </form>
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </div>

              {/* Results Section */}
              <div className="space-y-6">
                {groups.length > 0 ? (
                  <div className="flex justify-between items-end px-2">
                    <h3 className="text-xl font-bold text-slate-300">
                      Results <span className="text-indigo-400 text-sm ml-2 font-medium">({groups.length} groups found)</span>
                    </h3>
                  </div>
                ) : !isScraping && (
                  <div className="text-center py-20 opacity-50">
                    <Mail size={48} className="mx-auto mb-4 text-slate-600" />
                    <p>No results yet. Enter a word above to start scraping.</p>
                  </div>
                )}

                <div className="grid gap-4">
                  {groups.map((group, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="glass rounded-2xl border-white/5 overflow-hidden transition-all hover:border-white/10"
                    >
                      <div
                        onClick={() => toggleGroup(idx)}
                        className="p-5 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <MessageSquare size={18} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-200 line-clamp-1">{group.context}</h4>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{group.count} Messages</p>
                          </div>
                        </div>
                        <div className="text-slate-500">
                          {expandedGroups.includes(idx) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedGroups.includes(idx) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-slate-900/30"
                          >
                            <div className="p-5 space-y-4 border-t border-white/5">
                              <div className="flex justify-end mb-2">
                                <button 
                                  onClick={() => exportToCSV(group)}
                                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                                >
                                  <ExternalLink size={14} />
                                  Export Group to CSV
                                </button>
                              </div>
                              {group.emails.map((email, eIdx) => (
                                <div key={eIdx} className="p-4 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/[0.08] transition-all">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-bold text-indigo-300">{email.from}</span>
                                    <span className="text-xs text-slate-500">{new Date(email.date).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-sm text-slate-400 leading-relaxed mb-3">{email.snippet}</p>
                                  <div className="flex justify-end">
                                    <a 
                                      href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-semibold text-slate-500 flex items-center gap-1 hover:text-white transition-colors"
                                    >
                                      <ExternalLink size={12} />
                                      View Original
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 text-center text-slate-600 text-sm">
        <p>© 2026 EmailScraper. Built with intelligence.</p>
      </footer>
    </div>
  );
}

export default App;
