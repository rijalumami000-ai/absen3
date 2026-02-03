import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Home,
  Users,
  Building,
  UserCheck,
  UserCircle,
  UserCog,
  ClipboardList,
  Clock,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronRight,
  ChevronDown,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Eye,
  Database
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'superadmin';
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (menuId) => {
    setOpenMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const menuStructure = [
    { 
      id: 'dashboard',
      type: 'single', 
      path: '/dashboard', 
      icon: Home, 
      label: 'Dashboard',
      allowedRoles: ['superadmin', 'pesantren', 'madin'],
    },
    {
      id: 'setting-pesantren',
      type: 'group',
      icon: Building,
      label: 'Setting Pesantren',
      allowedRoles: ['superadmin', 'pesantren'],
      items: [
        { path: '/santri', icon: Database, label: 'Database Santri/Siswa' },
        { path: '/asrama', icon: Building, label: 'Asrama Santri' },
        { path: '/wali', icon: UserCircle, label: 'Wali Santri' },
      ]
    },
    {
      id: 'absensi-pesantren',
      type: 'group',
      icon: ClipboardList,
      label: 'Absensi Pesantren',
      allowedRoles: ['superadmin', 'pesantren'],
      items: [
        { path: '/pengabsen', icon: UserCheck, label: 'Pengabsen Sholat' },
        { path: '/pembimbing', icon: UserCog, label: 'Monitoring Sholat' },
        { path: '/absensi', icon: ClipboardList, label: 'Riwayat Absensi Sholat' },
        { path: '/waktu-sholat', icon: Clock, label: 'Waktu Sholat' },
      ]
    },
    {
      id: 'setting-madrasah',
      type: 'group',
      icon: GraduationCap,
      label: 'Setting Madrasah Diniyah',
      allowedRoles: ['superadmin', 'madin'],
      items: [
        { path: '/madrasah-diniyah', icon: BookOpen, label: 'Siswa Madin' },
        { path: '/kelas', icon: GraduationCap, label: 'Kelas Madrasah Diniyah' },
      ]
    },
    {
      id: 'absensi-madrasah',
      type: 'group',
      icon: ClipboardCheck,
      label: 'Absensi Madrasah Diniyah',
      allowedRoles: ['superadmin', 'madin'],
      items: [
        { path: '/pengabsen-kelas', icon: ClipboardCheck, label: 'Pengabsen Kelas Madin' },
        { path: '/monitoring-kelas', icon: Eye, label: 'Monitoring Kelas Madin' },
        { path: '/riwayat-absensi-madin', icon: ClipboardList, label: 'Riwayat Absensi Madin' },
      ],
    },
    {
      id: 'setting-aliyah',
      type: 'group',
      icon: GraduationCap,
      label: 'Setting Madrasah Aliyah',
      allowedRoles: ['superadmin', 'aliyah'],
      items: [
        { path: '/aliyah/siswa', icon: BookOpen, label: 'Siswa Aliyah' },
        { path: '/aliyah/kelas', icon: GraduationCap, label: 'Kelas Madrasah Aliyah' },
      ],
    },
    {
      id: 'absensi-aliyah',
      type: 'group',
      icon: ClipboardCheck,
      label: 'Absensi Madrasah Aliyah',
      allowedRoles: ['superadmin', 'aliyah'],
      items: [
        { path: '/aliyah/pengabsen', icon: ClipboardCheck, label: 'Pengabsen Kelas Aliyah' },
        { path: '/aliyah/monitoring', icon: Eye, label: 'Monitoring Kelas Aliyah' },
        { path: '/aliyah/riwayat', icon: ClipboardList, label: 'Riwayat Absensi Aliyah' },
        { path: '/aliyah/setting-aplikasi', icon: Settings, label: 'Setting Aplikasi' },
        { path: '/aliyah/setting-jam-pagi', icon: Clock, label: 'Pengaturan Jam Pagi Aliyah' },
      ],
    },
    {
      id: 'setting-pmq',
      type: 'group',
      icon: GraduationCap,
      label: 'Setting PMQ',
      allowedRoles: ['superadmin', 'admin'],
      items: [
        { path: '/pmq/siswa', icon: Users, label: 'Database Siswa PMQ' },
        { path: '/pmq/tingkatan', icon: Layers, label: 'Tingkatan & Kelompok PMQ' },
      ],
    },
    {
      id: 'absensi-pmq',
      type: 'group',
      icon: ClipboardCheck,
      label: 'Absensi PMQ',
      allowedRoles: ['superadmin', 'admin'],
      items: [
        { path: '/pmq/pengabsen', icon: UserCheck, label: 'Pengabsen PMQ' },
      ],
    },
    { 
      id: 'settings',
      type: 'single', 
      path: '/settings', 
      icon: Settings, 
      label: 'Pengaturan',
      allowedRoles: ['superadmin'],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border h-screen fixed left-0 top-0 z-40 flex-col shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L3 7v2h18V7L12 2zM5 11v7c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7H5zm7 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground">Absensi Sholat</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuStructure.map((menu, index) => {
              if (menu.type === 'single') {
                const isActive = location.pathname === menu.path;
                const isAllowed = !menu.allowedRoles || menu.allowedRoles.includes(role);
                const handleClick = (e) => {
                  if (!isAllowed) {
                    e.preventDefault();
                    toast({
                      title: 'Akses Ditolak',
                      description: 'Anda tidak punya hak akses',
                      variant: 'destructive',
                    });
                  }
                };
                return (
                  <li key={menu.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                    <Link
                      to={menu.path}
                      onClick={handleClick}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden hover-lift ${
                        isActive
                          ? 'bg-primary-800 text-white shadow-lg ring-1 ring-primary-500'
                          : isAllowed
                            ? 'text-muted-foreground hover:bg-primary-50 hover:text-primary-700'
                            : 'text-muted-foreground opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-full animate-scale-in" />}
                      <menu.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'}`} />
                      <span className="flex-1">{menu.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 animate-slide-in-right" />}
                    </Link>
                  </li>
                );
              } else if (menu.type === 'group') {
                const isOpen = openMenus[menu.id];
                const hasActiveChild = menu.items.some(item => location.pathname === item.path);
                const isAllowedGroup = !menu.allowedRoles || menu.allowedRoles.includes(role);
                const handleGroupClick = () => {
                  if (!isAllowedGroup) {
                    toast({
                      title: 'Akses Ditolak',
                      description: 'Anda tidak punya hak akses',
                      variant: 'destructive',
                    });
                    return;
                  }
                  toggleMenu(menu.id);
                };
                return (
                  <li key={menu.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                    <button
                      onClick={handleGroupClick}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover-lift ${
                        hasActiveChild
                          ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-300'
                          : isAllowedGroup
                            ? 'text-muted-foreground hover:bg-primary-50 hover:text-primary-700'
                            : 'text-muted-foreground opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <menu.icon className="w-5 h-5" />
                      <span className="flex-1 text-left">{menu.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <ul className="mt-1 ml-4 space-y-1 animate-scale-in">
                        {menu.items.map((item) => {
                          const isActive = location.pathname === item.path;
                          const isAllowedItem = isAllowedGroup; // item ikut aturan group
                          const handleItemClick = (e) => {
                            if (!isAllowedItem) {
                              e.preventDefault();
                              toast({
                                title: 'Akses Ditolak',
                                description: 'Anda tidak punya hak akses',
                                variant: 'destructive',
                              });
                            }
                          };
                          return (
                            <li key={item.path}>
                              <Link
                                to={item.path}
                                onClick={handleItemClick}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  isActive
                                    ? 'bg-primary-700 text-white shadow-md ring-1 ring-primary-400'
                                    : isAllowedItem
                                      ? 'text-muted-foreground hover:bg-primary-50 hover:text-primary-700'
                                      : 'text-muted-foreground opacity-60 cursor-not-allowed'
                                }`}
                              >
                                <item.icon className="w-4 h-4" />
                                <span className="flex-1">{item.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground">
                {role === 'superadmin' && 'Super Admin'}
                {role === 'pesantren' && 'Admin Pesantren'}
                {role === 'madin' && 'Admin Madrasah Diniyah'}
                {!role && 'Administrator'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 7v2h18V7L12 2zM5 11v7c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7H5zm7 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
          </div>
          <span className="font-display font-bold text-foreground">Absensi Sholat</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-card z-50 transform transition-transform duration-300 ease-out shadow-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L3 7v2h18V7L12 2zM5 11v7c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7H5zm7 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>
            </div>
            <span className="font-display font-bold text-foreground">Admin Panel</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 overflow-y-auto h-[calc(100%-180px)]">
          <ul className="space-y-1">
            {menuStructure.map((menu) => {
              if (menu.type === 'single') {
                const isActive = location.pathname === menu.path;
                return (
                  <li key={menu.id}>
                    <Link
                      to={menu.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary-700 text-white'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <menu.icon className="w-5 h-5" />
                      <span>{menu.label}</span>
                    </Link>
                  </li>
                );
              } else if (menu.type === 'group') {
                const isOpen = openMenus[menu.id];
                const hasActiveChild = menu.items.some(item => location.pathname === item.path);
                return (
                  <li key={menu.id}>
                    <button
                      onClick={() => toggleMenu(menu.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        hasActiveChild
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <menu.icon className="w-5 h-5" />
                      <span className="flex-1 text-left">{menu.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {menu.items.map((item) => {
                          const isActive = location.pathname === item.path;
                          return (
                            <li key={item.path}>
                              <Link
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  isActive
                                    ? 'bg-primary-700 text-white'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start gap-2"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pt-16 md:pt-0">
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
