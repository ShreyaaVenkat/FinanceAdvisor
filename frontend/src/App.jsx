import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// SVG Vector Icons
const DiamondIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="brand-logo">
    <path d="M6 3h12l4 6-10 13L2 9z" />
    <path d="M11 3 8 9l4 13 4-13-3-6" />
    <path d="M2 9h20" />
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

const TransactionsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
    <path d="M16 14h.01M12 14h.01M8 14h.01" />
  </svg>
);

const BudgetsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
  </svg>
);

const GoalsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const RiskProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-rose)' }}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '6px' }}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

export default function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [isLoginView, setIsLoginView] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Main UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Core Financial Data
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [profile, setProfile] = useState({ annual_income: 0, risk_tolerance: 'Medium', investment_experience: 'None', age: 30 });
  const [advisorReport, setAdvisorReport] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI Wealth Advisor. I have analyzed your transactions and set up recommendations. What financial questions can I answer for you today?', timestamp: new Date().toISOString() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Form states for creating new items
  const [newTx, setNewTx] = useState({ amount: '', category: 'Dining Out', date: new Date().toISOString().split('T')[0], type: 'expense', description: '' });
  const [newBudget, setNewBudget] = useState({ category: 'Dining Out', limit_amount: '' });
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', current_amount: '0', target_date: '' });

  // File Upload State
  const fileInputRef = useRef(null);

  // Show visual alerts
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Auth fetch wrapper
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData) && options.body) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'An error occurred.');
      }

      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      console.error(`API Fetch Error (${endpoint}):`, error);
      throw error;
    }
  };

  // Auth Handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;

    try {
      if (isLoginView) {
        const formData = new FormData();
        formData.append('username', authEmail);
        formData.append('password', authPassword);

        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: formData,
        });

        localStorage.setItem('token', data.access_token);
        localStorage.setItem('email', authEmail);
        setToken(data.access_token);
        setEmail(authEmail);
        showToast('Successfully logged in!', 'success');
      } else {
        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email: authEmail, password: authPassword }),
        });
        showToast('Registration successful! Please login.', 'success');
        setIsLoginView(true);
        setAuthPassword('');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setToken('');
    setEmail('');
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setAdvisorReport('');
    showToast('Logged out successfully.', 'success');
  };

  // Synchronize financial data
  const fetchData = async () => {
    if (!token) return;
    try {
      const txData = await apiFetch('/transactions');
      setTransactions(txData);

      const bdgData = await apiFetch('/budgets');
      setBudgets(bdgData);

      const goalData = await apiFetch('/goals');
      setGoals(goalData);

      const profileData = await apiFetch('/profile');
      setProfile(profileData);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Run LangGraph compiler to get overall advisory report
  const compileAdvisory = async () => {
    setIsCompiling(true);
    try {
      const data = await apiFetch('/advisor/compile', { method: 'POST' });
      setAdvisorReport(data.reply);
      showToast('AI Advisory Report compiled!', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to compile advice: ' + err.message, 'error');
    } finally {
      setIsCompiling(false);
    }
  };

  // Chat Advisor handler
  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: 'user', text: chatInput, timestamp: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await apiFetch('/advisor/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMsg.text,
          history: chatMessages
        }),
      });

      setChatMessages((prev) => [...prev, { sender: 'ai', text: response.reply, timestamp: new Date().toISOString() }]);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  // CRUD actions: Transactions
  const addTransaction = async (e) => {
    e.preventDefault();
    try {
      const added = await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(newTx.amount),
          category: newTx.category,
          date: newTx.date,
          type: newTx.type,
          description: newTx.description || 'Transaction'
        }),
      });
      setTransactions((prev) => [added, ...prev]);
      setNewTx({ amount: '', category: 'Dining Out', date: new Date().toISOString().split('T')[0], type: 'expense', description: '' });
      showToast('Transaction added!');
      compileAdvisory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast('Transaction deleted.');
      compileAdvisory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // CSV Upload handler
  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch('/transactions/upload', {
        method: 'POST',
        body: formData,
      });
      showToast(`Success! Imported ${res.imported} transactions.`, 'success');
      fetchData();
      compileAdvisory();
    } catch (err) {
      showToast('CSV parsing failed: ' + err.message, 'error');
    }
  };

  // CRUD actions: Budgets
  const saveBudget = async (e) => {
    e.preventDefault();
    try {
      const added = await apiFetch('/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category: newBudget.category,
          limit_amount: parseFloat(newBudget.limit_amount),
        }),
      });
      setBudgets((prev) => {
        const filtered = prev.filter((b) => b.category !== added.category);
        return [...filtered, added];
      });
      setNewBudget({ category: 'Dining Out', limit_amount: '' });
      showToast('Budget saved!');
      compileAdvisory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteBudget = async (id) => {
    try {
      await apiFetch(`/budgets/${id}`, { method: 'DELETE' });
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      showToast('Budget deleted.');
      compileAdvisory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // CRUD actions: Goals
  const addGoal = async (e) => {
    e.preventDefault();
    try {
      const added = await apiFetch('/goals', {
        method: 'POST',
        body: JSON.stringify({
          name: newGoal.name,
          target_amount: parseFloat(newGoal.target_amount),
          current_amount: parseFloat(newGoal.current_amount || 0),
          target_date: newGoal.target_date,
        }),
      });
      setGoals((prev) => [...prev, added]);
      setNewGoal({ name: '', target_amount: '', current_amount: '0', target_date: '' });
      showToast('Financial goal set!');
      compileAdvisory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updateGoalProgress = async (id, amount) => {
    try {
      const updated = await apiFetch(`/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ current_amount: parseFloat(amount) }),
      });
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
      showToast('Goal progress updated!');
      compileAdvisory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteGoal = async (id) => {
    try {
      await apiFetch(`/goals/${id}`, { method: 'DELETE' });
      setGoals((prev) => prev.filter((g) => g.id !== id));
      showToast('Goal removed.');
      compileAdvisory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Profile save
  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await apiFetch('/profile', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
      setProfile(updated);
      showToast('Risk profile updated successfully!');
      compileAdvisory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Chart computations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Group expenses by category
  const expenseCategories = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
    });

  const maxCategoryValue = Math.max(...Object.values(expenseCategories), 100);

  // Markdown parsing utility
  const parseMarkdown = (md) => {
    if (!md) return '';
    let html = md;
    
    // Parse tables
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableHtml = '<table><thead>';
        }
        
        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        
        // Separator row check
        if (cells.every(c => /^:-*|-*:-*|-*:$/.test(c))) {
          tableHtml = tableHtml.replace('</table><thead>', '</thead><tbody>');
          continue;
        }
        
        const isHeader = tableHtml.includes('<thead>') && !tableHtml.includes('</thead>');
        const cellTag = isHeader ? 'th' : 'td';
        
        tableHtml += 'tr';
        cells.forEach(cell => {
          tableHtml += `<${cellTag}>${cell}</${cellTag}>`;
        });
        tableHtml += '</tr>';
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table>';
          processedLines.push(tableHtml);
          tableHtml = '';
        }
        processedLines.push(lines[i]);
      }
    }
    if (inTable) {
      tableHtml += '</tbody></table>';
      processedLines.push(tableHtml);
    }
    
    html = processedLines.join('\n');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Alerts/Quotes
    html = html.replace(/^> \[\!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*$)/gim, '<blockquote><strong>$1</strong>: $2');
    html = html.replace(/^> (.*$)/gim, '<blockquote>$2</blockquote>');
    
    // Lists
    let inList = false;
    const listProcessed = [];
    const listLines = html.split('\n');
    for (let i = 0; i < listLines.length; i++) {
      const line = listLines[i];
      const match = line.match(/^[-*]\s+(.*)$/);
      if (match) {
        if (!inList) {
          inList = true;
          listProcessed.push('<ul>');
        }
        listProcessed.push(`<li>${match[1]}</li>`);
      } else {
        if (inList) {
          inList = false;
          listProcessed.push('</ul>');
        }
        listProcessed.push(line);
      }
    }
    if (inList) {
      listProcessed.push('</ul>');
    }
    html = listProcessed.join('\n');
    
    // Paragraph spacing
    html = html.replace(/\n\n/g, '<br />');

    return html;
  };

  // Authentication View
  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="glass-panel auth-card">
          <div className="auth-header">
            <span className="brand-logo" style={{ marginBottom: '12px' }}>
              <DiamondIcon />
            </span>
            <h2>AuraWealth</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '13px' }}>
              {isLoginView ? 'Welcome back! Sign in to analyze your assets.' : 'Create an account to start wealth planning.'}
            </p>
          </div>
          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              {isLoginView ? 'Sign In' : 'Get Started'}
            </button>
          </form>
          <div className="auth-toggle">
            {isLoginView ? (
              <p>Don't have an account? <span onClick={() => setIsLoginView(false)}>Sign Up</span></p>
            ) : (
              <p>Already have an account? <span onClick={() => setIsLoginView(true)}>Sign In</span></p>
            )}
          </div>
        </div>
        {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}
      </div>
    );
  }

  // Dashboard Layout
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-container">
          <DiamondIcon />
          <span className="brand-name">AuraWealth</span>
        </div>

        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-icon"><DashboardIcon /></span>
            <span className="nav-text">Dashboard</span>
          </li>
          <li className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            <span className="nav-icon"><TransactionsIcon /></span>
            <span className="nav-text">Transactions</span>
          </li>
          <li className={`nav-item ${activeTab === 'budgets' ? 'active' : ''}`} onClick={() => setActiveTab('budgets')}>
            <span className="nav-icon"><BudgetsIcon /></span>
            <span className="nav-text">Budgets</span>
          </li>
          <li className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`} onClick={() => setActiveTab('goals')}>
            <span className="nav-icon"><GoalsIcon /></span>
            <span className="nav-text">Goals</span>
          </li>
          <li className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <span className="nav-icon"><RiskProfileIcon /></span>
            <span className="nav-text">Risk Profile</span>
          </li>
        </ul>

        <div className="user-badge">
          <div className="user-avatar">{email.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-email">{email}</div>
            <div className="user-status">Aura Pro User</div>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Sign Out">
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className={`main-content ${isChatOpen ? 'ai-open' : ''}`}>
        <header className="dashboard-header">
          <div className="header-title">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard</h1>
            <p>Welcome back, AuraWealth helps you optimize savings velocity.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={compileAdvisory} disabled={isCompiling} className="btn btn-secondary">
              <SparklesIcon /> {isCompiling ? 'Analyzing Graph...' : 'Sync AI Advice'}
            </button>
            <button onClick={() => setIsChatOpen(!isChatOpen)} className="btn btn-primary">
              <ChatIcon /> {isChatOpen ? 'Close Assistant' : 'Ask AI Advisor'}
            </button>
          </div>
        </header>

        {/* Global Toast */}
        {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}

        {/* Dynamic Tab Switcher */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Top metrics row */}
            <div className="dashboard-grid">
              <div className="glass-panel metric-card">
                <div className="metric-label">Monthly Inflows</div>
                <div className="metric-value">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="metric-change positive">Active Payroll surplus</div>
              </div>
              <div className="glass-panel metric-card">
                <div className="metric-label">Monthly Spending</div>
                <div className="metric-value">${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="metric-change negative">Capital outflows</div>
              </div>
              <div className="glass-panel metric-card">
                <div className="metric-label">Net Monthly Savings</div>
                <div className="metric-value">${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="metric-change positive">Surplus margin</div>
              </div>
              <div className="glass-panel metric-card">
                <div className="metric-label">Savings Velocity</div>
                <div className="metric-value">{savingsRate.toFixed(1)}%</div>
                <div className={`metric-change ${savingsRate >= 20 ? 'positive' : 'negative'}`}>
                  Target benchmark: 20%
                </div>
              </div>
            </div>

            <div className="content-grid">
              {/* Chart Visualizer */}
              <div className="glass-panel">
                <div className="panel-title">Expense Category Breakdown</div>
                {Object.keys(expenseCategories).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No expense transactions recorded. Add data to visualize category outflows.</p>
                ) : (
                  <div className="chart-bar-container">
                    {Object.entries(expenseCategories).map(([cat, val]) => (
                      <div className="chart-bar-col" key={cat}>
                        <div
                          className="chart-bar-rect"
                          style={{ height: `${(val / maxCategoryValue) * 140}px` }}
                        ></div>
                        <div className="chart-bar-label">
                          <strong>${val.toFixed(0)}</strong>
                          <br />
                          {cat}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick AI advice overview */}
              <div className="glass-panel">
                <div className="panel-title">Advisor Status</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Asset Risk profile</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '6px', color: 'var(--primary)' }}>{profile.risk_tolerance} Allocation</div>
                  </div>
                  <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Budget Compliance</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '6px', color: 'var(--accent-emerald)' }}>
                      {budgets.length > 0 ? `${budgets.length} Categories Monitored` : 'No Active Budgets'}
                    </div>
                  </div>
                  <button onClick={() => { setActiveTab('profile'); }} className="btn btn-secondary" style={{ width: '100%' }}>Update Financial Stats</button>
                </div>
              </div>
            </div>

            {/* Core Advisor Report compiler output */}
            <div className="glass-panel" style={{ marginTop: '24px' }}>
              <div className="panel-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><SparklesIcon /> Compiled Wealth Advice Report</span>
                <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>LangGraph State Output</span>
              </div>
              {advisorReport ? (
                <div className="advisor-report-container" dangerouslySetInnerHTML={{ __html: parseMarkdown(advisorReport) }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>No advice compiled. Trigger the LangGraph multi-agent analyzer to synthesize your financial data.</p>
                  <button onClick={compileAdvisory} className="btn btn-primary" disabled={isCompiling}>
                    {isCompiling ? 'Running AI Engine...' : 'Run LangGraph Multi-Agent Analysis'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="content-grid">
            {/* Input Form */}
            <div className="glass-panel">
              <div className="panel-title">Add Transaction</div>
              <form onSubmit={addTransaction}>
                <div className="form-group">
                  <label className="form-label">Transaction Type</label>
                  <select
                    className="input-field"
                    value={newTx.type}
                    onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
                  >
                    <option value="expense">Expense (Outflow)</option>
                    <option value="income">Income (Inflow)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    placeholder="9.99"
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="input-field"
                    value={newTx.category}
                    onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                  >
                    <option value="Housing">Housing (Rent/Mortgage)</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Dining Out">Dining Out</option>
                    <option value="Transport">Transport</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Income">Salary / Income</option>
                    <option value="Shopping">Shopping & Discretionary</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newTx.date}
                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (Encrypted at rest)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Rent Payment, Starbucks Coffee"
                    value={newTx.description}
                    onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Transaction</button>
              </form>

              {/* CSV Upload */}
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
                <div className="panel-title" style={{ fontSize: '15px', marginBottom: '8px' }}>Import CSV Statements</div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
                  Upload a standard bank statement. Expected columns: <code>amount, category, date (YYYY-MM-DD), type, description</code>
                </p>
                <input
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleCSVUpload}
                />
                <button onClick={() => fileInputRef.current.click()} className="btn btn-secondary" style={{ width: '100%' }}>
                  <UploadIcon /> Choose CSV File
                </button>
              </div>
            </div>

            {/* List Table */}
            <div className="glass-panel">
              <div className="panel-title">Transaction Log</div>
              {transactions.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No transactions recorded.</p>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Desc</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.date}</td>
                          <td>{tx.description}</td>
                          <td>{tx.category}</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>${tx.amount.toFixed(2)}</td>
                          <td>
                            <span className={`badge badge-${tx.type}`}>{tx.type}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => deleteTransaction(tx.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="content-grid">
            {/* Create Budget */}
            <div className="glass-panel">
              <div className="panel-title">Set Category Limit</div>
              <form onSubmit={saveBudget}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="input-field"
                    value={newBudget.category}
                    onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  >
                    <option value="Housing">Housing</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Dining Out">Dining Out</option>
                    <option value="Transport">Transport</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Limit ($)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="500"
                    value={newBudget.limit_amount}
                    onChange={(e) => setNewBudget({ ...newBudget, limit_amount: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Define Budget</button>
              </form>
            </div>

            {/* List Budgets */}
            <div className="glass-panel">
              <div className="panel-title">Active Budgets</div>
              {budgets.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No active budgets defined.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                  {budgets.map((b) => {
                    const spent = b.spent_amount || 0;
                    const pct = Math.min(100, (spent / b.limit_amount) * 100);
                    return (
                      <div key={b.id} style={{ width: '100%', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', fontSize: '14.5px' }}>{b.category}</span>
                          <button onClick={() => deleteBudget(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <TrashIcon />
                          </button>
                        </div>
                        <div className="progress-container">
                          <div className="progress-label">
                            <span>Spent: ${spent.toFixed(2)} / limit: ${b.limit_amount.toFixed(2)}</span>
                            <span>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ 
                              width: `${pct}%`,
                              background: pct >= 100 ? 'var(--gradient-danger)' : pct >= 80 ? 'var(--gradient-warning)' : 'var(--gradient-success)'
                            }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="content-grid">
            {/* Create Goal */}
            <div className="glass-panel">
              <div className="panel-title">Create Goal Target</div>
              <form onSubmit={addGoal}>
                <div className="form-group">
                  <label className="form-label">Goal Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. House Down Payment, Retirement"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Amount ($)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="50000"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Savings Balances ($)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="5000"
                    value={newGoal.current_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, current_amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Set Wealth Target</button>
              </form>
            </div>

            {/* List Goals */}
            <div className="glass-panel">
              <div className="panel-title">Goal Tracker</div>
              {goals.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No financial goals active.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                  {goals.map((g) => {
                    const pct = Math.min(100, (g.current_amount / g.target_amount) * 100);
                    return (
                      <div key={g.id} style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-primary)' }}>{g.name}</span>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => {
                              const amount = prompt('Enter new current balance:', g.current_amount);
                              if (amount !== null) updateGoalProgress(g.id, amount);
                            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '12px', fontWeight: '600' }}>
                              <EditIcon /> Update
                            </button>
                            <button onClick={() => deleteGoal(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>Target Date: {g.target_date}</div>
                        <div className="progress-container">
                          <div className="progress-label">
                            <span>Saved: ${g.current_amount.toLocaleString()} / Target: ${g.target_amount.toLocaleString()}</span>
                            <span>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="content-grid">
            <div className="glass-panel">
              <div className="panel-title">Asset Risk & Financial Profile</div>
              <form onSubmit={saveProfile}>
                <div className="form-group">
                  <label className="form-label">Annual Baseline Income ($)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={profile.annual_income}
                    onChange={(e) => setProfile({ ...profile, annual_income: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Risk Tolerance</label>
                  <select
                    className="input-field"
                    value={profile.risk_tolerance}
                    onChange={(e) => setProfile({ ...profile, risk_tolerance: e.target.value })}
                  >
                    <option value="Low">Low (Safety First, Capital Preservation)</option>
                    <option value="Medium">Medium (Balanced Equity / Bonds Growth)</option>
                    <option value="High">High (Growth Indexing, Crypto, Alternates)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Investment Experience Level</label>
                  <select
                    className="input-field"
                    value={profile.investment_experience}
                    onChange={(e) => setProfile({ ...profile, investment_experience: e.target.value })}
                  >
                    <option value="None">None (Beginner)</option>
                    <option value="Basic">Basic (Familiar with stocks/ETFs)</option>
                    <option value="Advanced">Advanced (Options, Real Estate, Complex Portfolios)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    className="input-field"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Risk Statistics</button>
              </form>
            </div>
            
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', textAlign: 'center' }}>
              <span style={{ display: 'flex', marginBottom: '20px' }}><TrendingUpIcon /></span>
              <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Personalized Allocation Guidance</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '12px', lineHeight: '1.5' }}>
                Your risk profile metrics feeds directly into our LangGraph investment advice engine. It adjusts the equity-to-bond ratio automatically depending on age and risk choice.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Chat Assistant Panel (Right Column) */}
      <div className={`chat-drawer ${isChatOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <h3><SparklesIcon /> Aura Wealth Advisor</h3>
          <button className="chat-close" onClick={() => setIsChatOpen(false)}>✕</button>
        </div>

        <div className="chat-messages">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`chat-bubble ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {isChatLoading && (
            <div className="chat-bubble ai" style={{ opacity: 0.6 }}>
              Advisor is calculating allocations...
            </div>
          )}
        </div>

        <form className="chat-input-container" onSubmit={sendChatMessage}>
          <input
            type="text"
            className="input-field"
            placeholder="Ask about budgets, portfolios, savings velocity..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px' }}>Send</button>
        </form>
      </div>
    </div>
  );
}
