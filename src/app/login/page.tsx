'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Shield, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingInitialAuth, setCheckingInitialAuth] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function checkCurrentSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.access_token) {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const authData = await res.json();
            if (authData.authorized) {
              router.push('/');
              return;
            }
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setCheckingInitialAuth(false);
      }
    }
    checkCurrentSession();
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Authentication failed: no session returned');
      }

      // Verify admin authorization strictly via server-side API
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (!res.ok) {
        await supabase.auth.signOut();
        throw new Error('Access denied: Unauthorized administrator account.');
      }

      const authData = await res.json();
      if (!authData.authorized) {
        await supabase.auth.signOut();
        throw new Error(
          'Unauthorized: Your account does not have administrator privileges for FlarePrint Analytics.'
        );
      }

      // Successful admin login
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid login credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checkingInitialAuth) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mb-4">
          <Image
            src="/flareprint-icon.png"
            alt="FlarePrint"
            width={40}
            height={40}
            className="w-10 h-10 object-contain animate-pulse"
          />
        </div>
        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center mb-4">
          <Image
            src="/flareprint-logo.png"
            alt="FlarePrint"
            width={180}
            height={52}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 mb-2">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Admin Analytics Portal</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          FlarePrint Analytics
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Sign in to access kiosk telemetry, revenue, and order logs
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm rounded-2xl border border-slate-200">
          {error && (
            <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@sakec.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
