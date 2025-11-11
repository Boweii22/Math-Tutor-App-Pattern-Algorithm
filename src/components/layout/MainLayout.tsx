import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Sidebar } from '@/components/ui/Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  score: number;
  attempts: number;
  mastery: number;
  currentProblem?: {
    difficulty: string;
  } | null;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = 'MathMaster',
  score,
  attempts,
  mastery,
  currentProblem,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Personalized math learning platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex">
        <Sidebar score={score} attempts={attempts} mastery={mastery} />
        
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {title}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {currentProblem
                      ? `Working on ${currentProblem.difficulty.toLowerCase()} problem`
                      : 'Master math at your own pace'}
                  </p>
                </div>
                
                {currentProblem && (
                  <div className="flex items-center space-x-4">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-500">Difficulty</div>
                      <div className="font-medium capitalize">
                        {currentProblem.difficulty.toLowerCase()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
