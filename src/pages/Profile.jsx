import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { deleteAccount } from '../lib/api.js';

function RoleBadge({ role }) {
  return role === 'admin' ? (
    <span className="badge-admin">admin</span>
  ) : (
    <span className="badge-user">user</span>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (!user) return null;

  const joined = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Profile card */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-start gap-4">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name?.fullName}
              className="w-16 h-16 rounded-2xl ring-1 ring-white/10 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-semibold flex-shrink-0">
              {user.name?.firstName?.[0] || user.email?.[0]}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold">{user.name?.fullName}</h1>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
            <p className="text-slate-600 text-xs mt-1">Joined {joined}</p>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="glass-card divide-y divide-white/[0.06] mb-4">
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Account</p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">User ID</span>
              <span className="text-slate-300 font-mono text-xs">{user.uid}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Status</span>
              <span className="status-active">Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Timezone</span>
              <span className="text-slate-300">{user.preferences?.timezone || 'UTC'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Currency</span>
              <span className="text-slate-300">{user.preferences?.preferredCurrency || 'USD'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="glass-card p-5 mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Session</p>
        <button onClick={logout} className="btn-ghost text-sm w-full">
          Sign out
        </button>
      </div>

      {/* Danger zone */}
      <div className="glass-card p-5 border-red-500/10">
        <p className="text-xs text-red-500/70 uppercase tracking-wider mb-3">Danger zone</p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger text-sm w-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Delete account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              Your account will be scheduled for deletion with a 30-day recovery window.
              All sessions will be invalidated immediately.
            </p>
            {deleteError && (
              <p className="text-sm text-red-400">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="btn-danger text-sm flex-1"
              >
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
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
