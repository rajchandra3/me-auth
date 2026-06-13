import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Callback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    getMe()
      .then(({ data }) => {
        const user = data.data.user;
        setUser(user);
        navigate(user.role === 'admin' ? '/admin/users' : '/profile', { replace: true });
      })
      .catch(() => {
        navigate('/login?error=server', { replace: true });
      });
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">Signing you in…</p>
    </div>
  );
}
