import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-white font-semibold tracking-tight">
          <span className="text-blue-400">@</span>auth
        </Link>

        {user && (
          <div className="flex items-center gap-1">
            <Link
              to="/profile"
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isActive('/profile')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Profile
            </Link>

            {user.role === 'admin' && (
              <Link
                to="/admin/users"
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive('/admin')
                    ? 'bg-white/[0.08] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Users
              </Link>
            )}

            <div className="relative ml-2">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.05] transition-colors"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name?.fullName}
                    className="w-7 h-7 rounded-full ring-1 ring-white/10"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium">
                    {user.name?.firstName?.[0] || user.email?.[0]}
                  </div>
                )}
              </button>

              {open && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 glass-card shadow-xl z-50 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-white/[0.06]">
                      <p className="text-sm font-medium truncate">{user.name?.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setOpen(false); logout(); }}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
