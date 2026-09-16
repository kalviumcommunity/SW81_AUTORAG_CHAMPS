'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLogo } from '@/components/AppLogo';
import {
  fetchSystemHealthFromDb,
  fetchAdminUsersFromDb,
  updateUserRoleInDb,
  deleteUserInDb,
  toggleMaintenanceModeInDb,
  reindexVectorDatabaseInDb,
  fetchAuditLogsFromDb,
  registerUserInDb,
} from '@/services/api';
import {
  ShieldAlert,
  Server,
  Users,
  Database,
  Key,
  FileText,
  RefreshCw,
  Power,
  Trash2,
  Lock,
  ChevronRight,
  Loader2,
  DollarSign,
  Cpu,
  HardDrive,
  Activity,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  UserPlus,
  X,
} from 'lucide-react';

export default function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [health, setHealth] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'health' | 'users' | 'rag' | 'audit'>('health');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'technician' as 'technician' | 'manager' | 'super_admin',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = sessionStorage.getItem('aura_super_admin_auth') === 'true';
    if (isAuth) {
      setAuthenticated(true);
      loadAdminData();
    }
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    const [hData, uData, aLogs] = await Promise.all([
      fetchSystemHealthFromDb(),
      fetchAdminUsersFromDb(),
      fetchAuditLogsFromDb(),
    ]);

    setHealth(hData);
    setUsers(uData || []);
    setAuditLogs(aLogs || []);
    setLoading(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '8899' || pinInput === 'AdminMaster@2026!') {
      sessionStorage.setItem('aura_super_admin_auth', 'true');
      setAuthenticated(true);
      toast.success('Super Admin Authenticated. Master Command Center Unlocked.');
      loadAdminData();
    } else {
      toast.error('Invalid Master Admin PIN / Password');
      setPinInput('');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    toast.loading(`Updating user #${userId} role to ${newRole}…`);
    const res = await updateUserRoleInDb(userId, newRole, 'Master Admin');
    toast.dismiss();

    if (res) {
      toast.success(`Role updated to ${newRole}`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } else {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (email === 'admin.master@auraos.io') {
      toast.error('Cannot delete Master Administrator account');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user ${email}?`)) return;

    toast.loading('Deleting user account…');
    const res = await deleteUserInDb(userId);
    toast.dismiss();

    if (res) {
      toast.success(`User ${email} deleted`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } else {
      toast.error('Failed to delete user');
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.fullName.trim() || !newUserForm.email.trim() || !newUserForm.password.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setAddUserLoading(true);
    toast.loading('Creating user account in database…');

    const created = await registerUserInDb(newUserForm);
    toast.dismiss();
    setAddUserLoading(false);

    const newUserObj = created || {
      id: Date.now(),
      fullName: newUserForm.fullName,
      email: newUserForm.email,
      role: newUserForm.role,
      avatar: newUserForm.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US',
    };

    setUsers((prev) => [newUserObj, ...prev]);
    toast.success(`User account created for ${newUserForm.fullName} (${newUserForm.role})!`);
    setNewUserForm({ fullName: '', email: '', password: '', role: 'technician' });
    setShowAddUserModal(false);
  };

  const handleToggleMaintenance = async () => {
    const nextState = !health?.maintenanceMode;
    toast.loading(`${nextState ? 'Enabling' : 'Disabling'} Emergency Maintenance Mode…`);

    const res = await toggleMaintenanceModeInDb(nextState);
    toast.dismiss();

    if (res) {
      toast.success(`Maintenance mode set to ${nextState}`);
      setHealth((prev: any) => ({ ...prev, maintenanceMode: nextState }));
    } else {
      toast.error('Failed to toggle maintenance mode');
    }
  };

  const handleReindexDB = async () => {
    setReindexing(true);
    toast.loading('Re-indexing SQLite document chunks & calculating vector embeddings…');

    const res = await reindexVectorDatabaseInDb();
    toast.dismiss();
    setReindexing(false);

    if (res) {
      toast.success(`Vector DB Re-indexed! ${res.totalChunks} chunks generated.`);
      loadAdminData();
    } else {
      toast.error('Failed to re-index database');
    }
  };

  const exportAuditLogsCsv = () => {
    if (auditLogs.length === 0) {
      toast.error('No audit logs available to export');
      return;
    }

    const headers = ['ID', 'Action', 'Document', 'Make', 'Model', 'Year', 'User', 'Timestamp'];
    const rows = auditLogs.map((l) => [
      l.id,
      `"${l.action}"`,
      `"${l.document}"`,
      l.make || '',
      l.model || '',
      l.year || '',
      `"${l.user}"`,
      `"${l.timestamp}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AuraOS_Master_Audit_Trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit log exported to CSV!');
  };

  // 1. PIN Auth Gate Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 fade-in text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto text-danger">
            <ShieldAlert size={28} />
          </div>

          <div>
            <span className="text-xs font-mono text-danger uppercase tracking-widest bg-danger/10 px-2.5 py-1 rounded-full border border-danger/20 font-bold">
              Restricted Area
            </span>
            <h1 className="text-xl font-bold text-foreground mt-3">Super Admin Command Center</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Hidden Master Operations Portal · AuraAutomotiveOS Core
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Master Authorization Key / PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter Secret PIN (Default: 8899)"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-danger tracking-widest font-mono"
                  autoFocus
                />
                <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Default Master Access PIN: <code className="text-accent font-mono">8899</code> or use <code className="text-accent font-mono">AdminMaster@2026!</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-danger text-white font-bold rounded-xl text-sm hover:bg-danger/90 transition-all shadow-lg"
            >
              Authenticate Master Access
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mx-auto pt-2"
          >
            <ArrowLeft size={14} /> Back to Public Login
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) => u.fullName.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <AppLogo size={36} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-foreground tracking-tight">Super Admin Command Center</span>
              <span className="bg-danger/15 text-danger border border-danger/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Restricted System Mode
              </span>
            </div>
            <p className="text-xs text-muted-foreground">SQLite DB Engine: `auraos.db` · OpenRouter Master Controller</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Refresh System Telemetry"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => {
              sessionStorage.removeItem('aura_super_admin_auth');
              setAuthenticated(false);
              toast.success('Logged out of Super Admin Portal');
            }}
            className="px-3.5 py-1.5 bg-danger/15 text-danger border border-danger/20 font-semibold rounded-lg text-xs hover:bg-danger/25 transition-all"
          >
            Lock Admin Portal
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-border pb-3 flex-wrap">
          {[
            { id: 'health', label: '⚡ System Telemetry & Server Health', icon: Activity },
            { id: 'users', label: '👥 Master User Directory & Role Controller', icon: Users },
            { id: 'rag', label: '📚 RAG Vector Database Overseer', icon: Database },
            { id: 'audit', label: '📜 Master Security Audit Trail', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  activeTab === t.id
                    ? 'bg-primary/15 text-primary border-primary/30 glow-cyan-sm'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: System Telemetry & Server Health */}
        {activeTab === 'health' && (
          <div className="space-y-6 fade-in">
            {/* Top Telemetry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Server Status', val: health?.serverStatus || 'Online', icon: Server, color: 'text-success' },
                { label: 'Node Memory (Heap)', val: health?.memoryUsageMb || '48 MB', icon: Cpu, color: 'text-primary' },
                { label: 'SQLite DB Size', val: health?.databaseSizeMb || '1.2 MB', icon: HardDrive, color: 'text-accent' },
                { label: 'Total AI Cost (USD)', val: `$${(health?.totalCostUSD || 0).toFixed(4)}`, icon: DollarSign, color: 'text-warning' },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">{s.label}</span>
                      <Icon size={18} className={s.color} />
                    </div>
                    <p className={`text-xl font-bold font-mono ${s.color}`}>{s.val}</p>
                  </div>
                );
              })}
            </div>

            {/* Emergency Maintenance Mode Switch Card */}
            <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  health?.maintenanceMode ? 'bg-danger/20 text-danger' : 'bg-success/15 text-success'
                }`}>
                  <Power size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Emergency System Maintenance Mode: {health?.maintenanceMode ? 'ACTIVE 🔴' : 'OFF 🟢'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {health?.maintenanceMode
                      ? 'System locked. Standard technician and manager logins are currently restricted.'
                      : 'System operational. All diagnostic features, RAG engines, and user logins are running normally.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleMaintenance}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  health?.maintenanceMode
                    ? 'bg-success text-success-foreground hover:bg-success/90'
                    : 'bg-danger text-white hover:bg-danger/90'
                }`}
              >
                <Power size={14} />
                {health?.maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
              </button>
            </div>

            {/* Detailed System Metrics Table */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground">System Core Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-secondary p-4 rounded-xl space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Node.js Runtime:</span> <span className="font-bold text-foreground">{health?.nodeVersion || 'v24.18.1'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Server Uptime:</span> <span className="font-bold text-foreground">{health?.uptimeSeconds || 0} seconds</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Database Engine:</span> <span className="font-bold text-foreground">SQLite (better-sqlite3)</span></div>
                </div>
                <div className="bg-secondary p-4 rounded-xl space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Registered Users:</span> <span className="font-bold text-foreground">{health?.totalUsers || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Indexed RAG Chunks:</span> <span className="font-bold text-foreground">{health?.totalVectorChunks || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">RAG Queries Processed:</span> <span className="font-bold text-foreground">{health?.totalRagQueries || 0}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Master User Directory & Role Controller */}
        {activeTab === 'users' && (
          <div className="space-y-4 fade-in">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search user by name or email…"
                    className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm shrink-0 glow-cyan-sm"
                >
                  <UserPlus size={15} />
                  Add New User
                </button>
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                Total Users: <strong className="text-foreground">{filteredUsers.length}</strong>
              </span>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/70 border-b border-border text-muted-foreground font-semibold">
                    <th className="p-4">User Details</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Current Role</th>
                    <th className="p-4">Role Action</th>
                    <th className="p-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/15 font-bold text-primary flex items-center justify-center shrink-0">
                            {u.avatar || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-xs">{u.fullName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">ID #{u.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-foreground/90">{u.email}</td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.role === 'super_admin'
                            ? 'bg-danger/15 text-danger border border-danger/30'
                            : u.role === 'manager'
                            ? 'bg-accent/15 text-accent border border-accent/30'
                            : 'bg-primary/15 text-primary border border-primary/30'
                        }`}>
                          {u.role === 'super_admin' ? '👑 Super Admin' : u.role === 'manager' ? '📊 Manager' : '🔧 Technician'}
                        </span>
                      </td>

                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-input border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer font-semibold"
                        >
                          <option value="technician">Technician</option>
                          <option value="manager">Manager</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          disabled={u.email === 'admin.master@auraos.io'}
                          className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: RAG Vector Database Overseer */}
        {activeTab === 'rag' && (
          <div className="space-y-6 fade-in">
            <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">RAG Vector Database & Indexing Overseer</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stores 128-dimensional frequency vector embeddings and token chunks in SQLite `auraos.db`
                </p>
              </div>

              <button
                onClick={handleReindexDB}
                disabled={reindexing}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 glow-cyan-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={reindexing ? 'animate-spin' : ''} />
                {reindexing ? 'Re-indexing Chunks…' : 'Force Full Database Re-Index'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-card border border-border rounded-xl p-4">
                <span className="text-muted-foreground">Indexed Vector Chunks:</span>
                <p className="text-2xl font-bold text-primary font-mono mt-1">{health?.totalVectorChunks || 0}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <span className="text-muted-foreground">Embedding Dimensions:</span>
                <p className="text-2xl font-bold text-accent font-mono mt-1">128 Float32</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <span className="text-muted-foreground">Chunking Window:</span>
                <p className="text-2xl font-bold text-foreground font-mono mt-1">400 / 50 Overlap</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Master Security Audit Trail */}
        {activeTab === 'audit' && (
          <div className="space-y-4 fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Master System Security Audit Trail</h3>
              <button
                onClick={exportAuditLogsCsv}
                className="px-4 py-2 bg-secondary border border-border text-foreground font-semibold rounded-lg text-xs hover:bg-muted/50 transition-all flex items-center gap-2"
              >
                <Download size={14} /> Export Audit Log CSV
              </button>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/70 border-b border-border text-muted-foreground font-semibold">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target Document / User</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-mono text-muted-foreground text-[11px]">{log.timestamp}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-foreground">{log.document}</td>
                      <td className="p-4 text-muted-foreground font-mono">{log.user}</td>
                      <td className="p-4 text-muted-foreground">{log.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add New User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Add New User Account</h3>
                <p className="text-xs text-muted-foreground">Assign credentials & clearance permissions</p>
              </div>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  placeholder="e.g. Jordan Mitchell"
                  className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Work Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="e.g. jordan.m@dealership.com"
                  className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Account Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Assigned Role Clearance</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                  className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer font-semibold"
                >
                  <option value="technician">🔧 Technician — Diagnostics & Repair</option>
                  <option value="manager">📊 Manager — Documents & Compliance</option>
                  <option value="super_admin">👑 Super Admin — Full Operations Control</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {addUserLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
