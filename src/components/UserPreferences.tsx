'use client';

import { useState, useEffect } from 'react';
import { MathLearningAssistant } from '@/lib/gapAnalysis';

interface UserPreferencesProps {
  learningAssistant: MathLearningAssistant;
  onPreferencesUpdate?: () => void;
}

export default function UserPreferences({ learningAssistant, onPreferencesUpdate }: UserPreferencesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<{
    learningStyle: 'visual' | 'verbal' | 'kinesthetic' | 'mixed';
    preferredPathType: 'fastest' | 'mostThorough' | 'examFocused';
    dailyGoal: number;
    availableTime: number;
    notifications: boolean;
    darkMode: boolean;
  }>({
    learningStyle: 'mixed',
    preferredPathType: 'fastest',
    dailyGoal: 30,
    availableTime: 60,
    notifications: true,
    darkMode: false
  });

  useEffect(() => {
    // Load saved preferences
    const savedPrefs = learningAssistant.getPreferences();
    if (savedPrefs) {
      setPreferences(prev => ({
        ...prev,
        ...savedPrefs,
        learningStyle: savedPrefs.learningStyle || 'mixed',
        preferredPathType: savedPrefs.preferredPathType || 'fastest',
        dailyGoal: savedPrefs.dailyGoal || 30,
        availableTime: savedPrefs.availableTime || 60
      }));
    }
  }, [learningAssistant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setPreferences(prev => {
      const newValue = type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseInt(value, 10) 
          : value;
      
      // Ensure type safety for the preferences object
      return {
        ...prev,
        [name]: newValue
      };
    });
  };

  const savePreferences = () => {
    learningAssistant.updatePreferences(preferences);
    if (onPreferencesUpdate) onPreferencesUpdate();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 hover:shadow-xl z-10"
        aria-label="Open preferences"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Learning Preferences</h2>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Learning Style */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Learning Style</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { value: 'visual' as const, label: 'Visual', icon: '👁️' },
                  { value: 'verbal' as const, label: 'Verbal', icon: '🗣️' },
                  { value: 'kinesthetic' as const, label: 'Kinesthetic', icon: '✋' },
                  { value: 'mixed' as const, label: 'Mixed', icon: '🔄' }
                ].map(style => (
                  <label 
                    key={style.value}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      preferences.learningStyle === style.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="learningStyle"
                      value={style.value}
                      checked={preferences.learningStyle === style.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{style.icon}</span>
                    <span className="font-medium">{style.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preferred Learning Path */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Preferred Learning Path</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'fastest', label: 'Fastest', description: 'Quickest route to mastery' },
                  { value: 'mostThorough', label: 'Most Thorough', description: 'Comprehensive coverage' },
                  { value: 'examFocused', label: 'Exam Focused', description: 'High-yield topics' }
                ].map(path => (
                  <label 
                    key={path.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      preferences.preferredPathType === path.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="preferredPathType"
                      value={path.value}
                      checked={preferences.preferredPathType === path.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="font-medium text-gray-900">{path.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{path.description}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Study Goals */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Daily Study Goal</h3>
                <div className="flex items-center">
                  <input
                    type="range"
                    name="dailyGoal"
                    min="10"
                    max="120"
                    step="5"
                    value={preferences.dailyGoal}
                    onChange={handleChange}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-4 w-16 text-center font-medium">
                    {preferences.dailyGoal} min
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10 min</span>
                  <span>2 hours</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Available Time per Session</h3>
                <div className="flex items-center">
                  <input
                    type="range"
                    name="availableTime"
                    min="15"
                    max="180"
                    step="5"
                    value={preferences.availableTime}
                    onChange={handleChange}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-4 w-24 text-center font-medium">
                    {Math.floor(preferences.availableTime / 60)}h {preferences.availableTime % 60}m
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>15 min</span>
                  <span>3 hours</span>
                </div>
              </div>
            </div>

            {/* Additional Preferences */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-800">Additional Preferences</h3>
              
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">Dark Mode</div>
                  <div className="text-sm text-gray-500">Use dark theme</div>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    name="darkMode"
                    checked={preferences.darkMode as boolean}
                    onChange={handleChange}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  />
                  <label 
                    htmlFor="darkMode"
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                      preferences.darkMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  ></label>
                </div>
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">Study Reminders</div>
                  <div className="text-sm text-gray-500">Get notifications for study sessions</div>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    name="notifications"
                    checked={preferences.notifications as boolean}
                    onChange={handleChange}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  />
                  <label 
                    htmlFor="notifications"
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                      preferences.notifications ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  ></label>
                </div>
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={savePreferences}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
