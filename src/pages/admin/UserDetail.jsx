import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  adminGetUser,
  adminUpdateRole,
  adminBlockUser,
  adminUnblockUser,
  adminRevokeSessions,
  adminDeleteUser,
} from '../../lib/api.js';

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

function Field({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-right">{value || <span className="text-slate-600">—</span>}</span>
    </div>
  );
}

function DangerButton({ onClick, loading, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? 'Processing…' : children}
    </button>
  );
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminGetUser(id);
      setData(res.data.data);
    } catch {
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const act = async (type, fn) => {
    setActionLoading(type);
    try {
      await fn();
      if (type === 'delete') {
        navigate('/admin/users');
      } else {
        await load();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-center py-20 text-slate-500">{error || 'Not found'}</div>;
  }

  const { user, sessions } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white text-sm mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to users
      </Link>

      {/* Identity */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          {user.picture ? (
            <img src={user.picture} alt="" className="w-14 h-14 rounded-2xl ring-1 ring-white/10" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-xl font-medium text-blue-300">
              {user.name?.firstName?.[0] || user.email?.[0]}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{user.name?.fullName}</span>
              <RoleBadge role={user.role} />
              <StatusBadge user={user} />
            </div>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
        </div>

        <Field label="User ID" value={<span className="font-mono text-xs text-slate-400">{user.uid}</span>} />
        <Field label="MongoDB ID" value={<span className="font-mono text-xs text-slate-600">{user._id}</span>} />
        <Field label="Joined" value={fmt(user.createdAt)} />
        <Field label="Updated" value={fmt(user.updatedAt)} />
        <Field label="Timezone" value={user.preferences?.timezone} />
        <Field label="Currency" value={user.preferences?.preferredCurrency} />

        {user.isBlocked && (
          <>
            <Field label="Blocked at" value={fmt(user.blockedAt)} />
            <Field label="Block reason" value={user.blockedReason} />
          </>
        )}
        {user.isDeleted && (
          <>
            <Field label="Deleted at" value={fmt(user.deletedAt)} />
            <Field label="Grace period ends" value={fmt(user.deletionGracePeriodEnds)} />
          </>
        )}
      </div>

      {/* Sessions */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            Active sessions ({sessions.length})
          </p>
          {sessions.length > 0 && (
            <button
              onClick={() => act('revoke', () => adminRevokeSessions(user._id))}
              disabled={actionLoading === 'revoke'}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              {actionLoading === 'revoke' ? 'Revoking…' : 'Revoke all'}
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <p className="text-sm text-slate-600">No active sessions</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                <p className="text-xs text-slate-400 truncate">{s.userAgent || 'Unknown device'}</p>
                <p className="text-xs text-slate-600 mt-1">
                  IP: {s.ipAddress || '—'} · Last used: {fmt(s.lastUsedAt)}
                </p>
                <p className="text-xs text-slate-700">Expires: {fmt(s.expiresAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin actions */}
      {!user.isDeleted && (
        <div className="glass-card p-5 mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Actions</p>

          {/* Role toggle */}
          <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
            <div>
              <p className="text-sm font-medium">Role</p>
              <p className="text-xs text-slate-500">
                {user.role === 'admin' ? 'Remove admin privileges' : 'Grant admin privileges'}
              </p>
            </div>
            <DangerButton
              onClick={() =>
                act('role', () =>
                  adminUpdateRole(user._id, user.role === 'admin' ? 'user' : 'admin'),
                )
              }
              loading={actionLoading === 'role'}
              className={
                user.role === 'admin'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
              }
            >
              {user.role === 'admin' ? 'Remove admin' : 'Grant admin'}
            </DangerButton>
          </div>

          {/* Block/unblock */}
          <div className="py-3 border-b border-white/[0.04]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{user.isBlocked ? 'Unblock' : 'Block'} user</p>
                <p className="text-xs text-slate-500">
                  {user.isBlocked ? 'Restore access' : 'Revoke access and invalidate sessions'}
                </p>
              </div>
              <DangerButton
                onClick={() =>
                  user.isBlocked
                    ? act('block', () => adminUnblockUser(user._id))
                    : null
                }
                loading={actionLoading === 'block' && user.isBlocked}
                className={
                  user.isBlocked
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                }
              >
                {user.isBlocked ? 'Unblock' : null}
              </DangerButton>
            </div>

            {!user.isBlocked && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Block reason (optional)"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-white/20"
                />
                <DangerButton
                  onClick={() => act('block', () => adminBlockUser(user._id, blockReason))}
                  loading={actionLoading === 'block'}
                  className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 flex-shrink-0"
                >
                  Block
                </DangerButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="glass-card p-5 border-red-500/[0.08]">
        <p className="text-xs text-red-500/70 uppercase tracking-wider mb-3">Danger zone</p>

        {!confirmDelete ? (
          <DangerButton
            onClick={() => setConfirmDelete(true)}
            className="w-full bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
          >
            Permanently delete user
          </DangerButton>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              This will hard-delete <span className="text-white font-medium">{user.email}</span>.
              No grace period. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <DangerButton
                onClick={() => act('delete', () => adminDeleteUser(user._id))}
                loading={actionLoading === 'delete'}
                className="flex-1 bg-red-600 text-white border-red-600 hover:bg-red-500"
              >
                Confirm delete
              </DangerButton>
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn-ghost text-sm flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
