import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Bell, Settings, LogOut, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function Sidebar({ open, setOpen, children }) {
  return (
    <div className={`flex h-full ${open ? 'w-64' : 'w-16'} transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700`}>
      {children}
    </div>
  );
}

export function SidebarBody({ className = '', children }) {
  return (
    <div className={`flex flex-col p-4 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarLink({ link, onClick }) {
  const location = useLocation();
  const isActive = link.href && location.pathname.startsWith(link.href.replace('#', ''));
  
  return (
    <Link
      to={link.href?.replace('#', '') || '#'}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
        isActive ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
      }`}
    >
      {link.icon}
      <span className="text-sm font-medium">{link.label}</span>
    </Link>
  );
}

export function Logo() {
  return (
    <div className="text-xl font-bold text-gray-900 dark:text-white">
      Anon<span className="text-blue-600">Feed</span>
    </div>
  );
}

export function LogoIcon() {
  return (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
      <span className="text-white font-bold text-sm">A</span>
    </div>
  );
}

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="text-sm font-medium">
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
}

export default function AppSidebar({ open, setOpen }) {
  const { user, logout } = useAuth();
  
  const navigationLinks = [
    { label: 'Home', href: '/', icon: <HomeIcon className="h-5 w-5" /> },
    { label: 'Notifications', href: '/notifications', icon: <Bell className="h-5 w-5" /> },
    { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> }
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mb-8">
            {open ? <Logo /> : <LogoIcon />}
          </div>
          
          <nav className="flex flex-col gap-2">
            {navigationLinks.map((link, index) => (
              <SidebarLink key={index} link={link} />
            ))}
            
            <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
            
            <ThemeToggle />
            
            <SidebarLink 
              link={{ 
                label: 'Logout', 
                href: '/auth', 
                icon: <LogOut className="h-5 w-5" /> 
              }} 
              onClick={logout} 
            />
          </nav>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <SidebarLink 
            link={{
              label: user?.anonymousName || 'Anonymous User',
              href: '/profile/me',
              icon: (
                <div className="h-7 w-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )
            }}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}