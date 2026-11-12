import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { LayoutDashboard, Grid, Users, Tag, ShieldAlert } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Memverifikasi hak akses admin...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center rounded-3xl bg-white border border-red-200 shadow-sm space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Akses Ditolak (403)</h2>
        <p className="text-xs text-slate-500">
          Halaman ini hanya dapat diakses oleh akun dengan peran ADMINISTRATOR. Silakan login menggunakan akun admin resmi.
        </p>
      </div>
    );
  }

  const navItems = [
    { to: '/admin', label: 'Ringkasan', icon: LayoutDashboard, end: true },
    { to: '/admin/sub-apps', label: 'Kelola Sub-App', icon: Grid },
    { to: '/admin/creative-profiles', label: 'Pelaku Kreatif', icon: Users },
    { to: '/admin/categories', label: 'Kategori & Taksonomi', icon: Tag },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold tracking-wider uppercase mb-1">
            Mode Administrator
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Panel Pengelolaan Ekraf HUB
          </h1>
        </div>

        {/* Admin Tab Nav */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`
              }
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet />
    </div>
  );
};
