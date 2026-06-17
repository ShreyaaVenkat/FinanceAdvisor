import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
        // Clear auth on token expiration
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
        // Login flow
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
        // Register flow
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
      
      // Re-fetch data because compiling auto-calculates spent budget amounts
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
      
      // Auto compile report to update stats
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
      // Replace or insert
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

  // Group expenses by category for css chart
  const expenseCategories = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
    });

  const maxCategoryValue = Math.max(...Object.values(expenseCategories), 100);

  // Authentication View
  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="glass-panel auth-card">
          <div className="auth-header">
            <span className="brand-logo">💎</span>
            <h2>AuraWealth</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
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
          <span className="brand-logo">💎</span>
          <span className="brand-name">AuraWealth</span>
        </div>

        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </li>
          <li className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            <span className="nav-icon">💸</span>
            <span className="nav-text">Transactions</span>
          </li>
          <li className={`nav-item ${activeTab === 'budgets' ? 'active' : ''}`} onClick={() => setActiveTab('budgets')}>
            <span className="nav-icon">📝</span>
            <span className="nav-text">Budgets</span>
          </li>
          <li className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`} onClick={() => setActiveTab('goals')}>
            <span className="nav-icon">🎯</span>
            <span className="nav-text">Goals</span>
          </li>
          <li className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <span className="nav-icon">👤</span>
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
            🚪
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="main-content">
        <header className="dashboard-header">
          <div className="header-title">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard</h1>
            <p>Welcome back, AuraWealth helps you optimize savings velocity.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={compileAdvisory} disabled={isCompiling} className="btn btn-secondary">
              {isCompiling ? 'Analyzing Graph...' : '⚡ Sync AI Advice'}
            </button>
            <button onClick={() => setIsChatOpen(true)} className="btn btn-primary">
              💬 Ask AI Advisor
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
              <div className="glass-panel metric-card warning">
                <div className="metric-label">Monthly Spending</div>
                <div className="metric-value">${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="metric-change negative">Capital outflows</div>
              </div>
              <div className="glass-panel metric-card success">
                <div className="metric-label">Net Monthly Savings</div>
                <div className="metric-value">${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="metric-change positive">Surplus margin</div>
              </div>
              <div className={`glass-panel metric-card ${savingsRate >= 20 ? 'success' : 'danger'}`}>
                <div className="metric-label">Savings Velocity</div>
                <div className="metric-value">{savingsRate.toFixed(1)}%</div>
                <div className="metric-change">Target benchmark: 20%</div>
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
                          style={{ height: `${(val / maxCategoryValue) * 160}px` }}
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
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Asset Risk profile</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: 'var(--primary)' }}>{profile.risk_tolerance} Allocation</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Budget Compliance</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: '#10b981' }}>
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
                <span>💎 compiled wealth advice report</span>
                <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>LangGraph State Output</span>
              </div>
              {advisorReport ? (
                <div className="advisor-report-container">
                  <div dangerouslySetInnerHTML={{ 
                    __html: advisorReport
                      .replace(/# (.*)/g, '<h2>$1</h2>')
                      .replace(/## (.*)/g, '<h3>$1</h3>')
                      .replace(/### (.*)/g, '<h4>$1</h4>')
                      .replace(/- \*\*(.*?)\*\*:(.*)/g, '<li><strong>$1</strong>: $2</li>')
                      .replace(/> \[!(NOTE|WARNING|CAUTION|TIP)\]/g, '<blockquote>')
                      .replace(/\| (.*) \|/g, (match) => {
                        // Very basic table parser helper
                        return match;
                      })
                  }} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No advice compiled. Trigger the LangGraph multi-agent analyzer to synthesize your financial data.</p>
                  <button onClick={compileAdvisory} className="btn btn-primary" disabled={isCompiling}>
                    {isCompiling ? 'Running AI Engine...' : 'Run LangGraph Multi-Agent Analysis'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="content-grid equal">
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
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-glass)' }}>
                <div className="panel-title" style={{ fontSize: '16px' }}>Import CSV Statements</div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
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
                  📤 Choose CSV File
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
                          <td style={{ fontWeight: 'bold' }}>${tx.amount.toFixed(2)}</td>
                          <td>
                            <span className={`badge badge-${tx.type}`}>{tx.type}</span>
                          </td>
                          <td>
                            <button onClick={() => deleteTransaction(tx.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)' }}>
                              🗑️
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
          <div className="content-grid equal">
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
                <div style={{ display: 'flex', flexcolumn: 'column', gap: '20px', width: '100%' }}>
                  {budgets.map((b) => {
                    const spent = b.spent_amount || 0;
                    const pct = Math.min(100, (spent / b.limit_amount) * 100);
                    return (
                      <div key={b.id} style={{ width: '100%', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600' }}>{b.category}</span>
                          <button onClick={() => deleteBudget(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            🗑️
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
          <div className="content-grid equal">
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
                      <div key={g.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{g.name}</span>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => {
                              const amount = prompt('Enter new current balance:', g.current_amount);
                              if (amount !== null) updateGoalProgress(g.id, amount);
                            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                              ✏️ Update Progress
                            </button>
                            <button onClick={() => deleteGoal(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Target Date: {g.target_date}</div>
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
          <div className="content-grid equal">
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
                  <label className="form-label">Risk Tolerance Tolerance</label>
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
              <span style={{ fontSize: '48px', filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.3))' }}>📈</span>
              <h3 style={{ marginTop: '20px', fontFamily: 'var(--font-display)' }}>Personalized Allocation Guidance</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '12px', lineHeight: '1.5' }}>
                Your risk profile metrics feeds directly into our LangGraph investment advice engine. It adjusts the equity-to-bond ratio automatically depending on age and risk choice.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Chat Assistant Drawer */}
      <div className={`chat-drawer ${isChatOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <h3>💬 Aura Wealth Advisor</h3>
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
          <button type="submit" className="btn btn-primary">Send</button>
        </form>
      </div>
    </div>
  );
}
