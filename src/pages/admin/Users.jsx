import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  adminListUsers,
  adminBlockUser,
  adminUnblockUser,
  adminUpdateRole,
  adminRevokeSessions,
  adminDeleteUser,
} from '../../lib/api.js';

const STATUS_TABS = ['all', 'active', 'blocked', 'deleted'];

function Avatar({ user }) {
  if (user.picture) {
    return <img src={user.picture} alt="" className="w-8 h-8 rounded-full ring-1 ring-white/10" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-xs font-medium text-blue-300">
      {user.name?.firstName?.[0] || user.email?.[0] || '?'}
    </div>
  );
}

function RoleBadge({ role }) {
  return role === 'admin'
    ? <span className="badge-admin">admin</span>
    : <span className="badge-user">user</span>;
}

function StatusBadge({ user }) {
  if (user.isDeleted) return <span className="status-deleted">deleted</span>;
  if (user.isBlocked) return <span className="status-blocked">blocked</span>;
  return <span className="status-active">active</span>;
}

function ActionMenu({ user, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const action = (type) => { setOpen(false); onAction(type, user); };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 glass-card shadow-xl z-20 overflow-hidden">
          <Link
            to={`/admin/users/${user._id}`}
            className="block px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.05] transition-colors"
            onClick={() => setOpen(false)}
          >
            View details
          </Link>

          {!user.isDeleted && (
            <>
              <button
                onClick={() => action(user.role === 'admin' ? 'demote' : 'promote')}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.05] transition-colors"
              >
                {user.role === 'admin' ? 'Remove admin' : 'Make admin'}
              </button>

              <button
                onClick={() => action(user.isBlocked ? 'unblock' : 'block')}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/[0.05] transition-colors ${
                  user.isBlocked ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {user.isBlocked ? 'Unblock' : 'Block'}
              </button>

              <button
                onClick={() => action('revoke')}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.05] transition-colors"
              >
                Revoke sessions
              </button>
            </>
          )}

          <div className="border-t border-white/[0.06] mt-1 pt-1">
            <button
              onClick={() => action('delete')}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmModal({ action, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const messages = {
    block: { title: 'Block user', desc: 'This will revoke all their sessions.', confirm: 'Block', danger: true, showReason: true },
    delete: { title: 'Delete user', desc: 'This is permanent and cannot be undone.', confirm: 'Delete', danger: true },
    revoke: { title: 'Revoke sessions', desc: 'All active sessions will be invalidated.', confirm: 'Revoke', danger: false },
    promote: { title: 'Grant admin', desc: 'User will have full admin access.', confirm: 'Grant admin', danger: false },
    demote: { title: 'Remove admin', desc: 'User will lose admin access.', confirm: 'Remove admin', danger: true },
  };

  const cfg = messages[action?.type] || {};

  const handle = async () => {
    setLoading(true);
    await onConfirm(action, reason);
    setLoading(false);
  };

  if (!action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="glass-card p-5 w-full max-w-sm relative shadow-2xl">
        <h3 className="font-semibold mb-1">{cfg.title}</h3>
        <p className="text-sm text-slate-400 mb-4">{cfg.desc}</p>
        <p className="text-sm text-slate-300 mb-4">
          User: <span className="font-medium">{action.user?.email}</span>
        </p>

        {cfg.showReason && (
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-white/20 mb-4"
          />
        )}

        <div className="flex gap-2">
          <button
            onClick={handle}
            disabled={loading}
            className={`flex-1 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              cfg.danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {loading ? 'Processing…' : cfg.confirm}
          </button>
          <button onClick={onCancel} className="btn-ghost text-sm flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState(null);

  const searchTimer = useRef(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 25 };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;

      const { data } = await adminListUsers(params);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearchChange = (e) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(e.target.value);
      setPage(1);
    }, 300);
  };

  const handleAction = (type, user) => {
    if (type === 'unblock') {
      executeAction({ type, user }, '');
    } else {
      setPendingAction({ type, user });
    }
  };

  const executeAction = async ({ type, user }, reason) => {
    try {
      if (type === 'block') await adminBlockUser(user._id, reason);
      else if (type === 'unblock') await adminUnblockUser(user._id);
      else if (type === 'promote') await adminUpdateRole(user._id, 'admin');
      else if (type === 'demote') await adminUpdateRole(user._id, 'user');
      else if (type === 'revoke') await adminRevokeSessions(user._id);
      else if (type === 'delete') await adminDeleteUser(user._id);

      setPendingAction(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const fmt = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          {pagination && (
            <p className="text-slate-500 text-sm mt-0.5">{pagination.total} total</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            onChange={handleSearchChange}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setStatus(tab); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                status === tab
                  ? 'bg-white/[0.08] text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-slate-500">{error}</div>
        ) : loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No users found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider hidden sm:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[160px]">
                          {user.name?.fullName || '—'}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[160px]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge user={user} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 hidden md:table-cell">
                    {fmt(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionMenu user={user} onAction={handleAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        action={pendingAction}
        onConfirm={executeAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
