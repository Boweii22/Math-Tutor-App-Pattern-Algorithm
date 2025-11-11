import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  score: number;
  attempts: number;
  mastery: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ score, attempts, mastery }) => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Practice', href: '/practice', icon: '🧩' },
    { name: 'Learning Paths', href: '/learn', icon: '🛤️' },
    { name: 'Progress', href: '/progress', icon: '📈' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-indigo-900 to-blue-900 text-white p-6 flex flex-col">
      <div className="mb-10">
        <h1 className="text-2xl font-bold mb-1">MathMaster</h1>
        <p className="text-blue-200 text-sm">Personalized Math Learning</p>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-blue-700 text-white'
                : 'text-blue-100 hover:bg-blue-800'
            }`}
          >
            <span className="text-xl mr-3">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-blue-800">
        <div className="mb-4">
          <div className="flex justify-between text-sm text-blue-200 mb-1">
            <span>Mastery Level</span>
            <span>{Math.round(mastery * 100)}%</span>
          </div>
          <div className="w-full bg-blue-800 rounded-full h-2">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              style={{ width: `${mastery * 100}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-blue-200">
          <div className="text-center">
            <div className="font-semibold text-white">{score}</div>
            <div className="text-xs">Score</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-white">{attempts}</div>
            <div className="text-xs">Problems</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-white">3</div>
            <div className="text-xs">Day Streak</div>
          </div>
        </div>
      </div>
    </div>
  );
};
