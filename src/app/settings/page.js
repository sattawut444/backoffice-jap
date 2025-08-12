'use client';

import { useState } from 'react';
import { useLanguage } from '../components/LanguageProvider';

export default function SettingsPage() {
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');
  const API_BASE_URL = process.env.API_BASE_URL;
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    autoSave: true,
    darkMode: false,
    language: currentLanguage,
    timezone: 'Asia/Bangkok'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // If language is changed, update the global language
    if (key === 'language') {
      changeLanguage(value);
    }
  };

  const tabs = [
    { id: 'general', name: t('general'), icon: '⚙️' },
    { id: 'notifications', name: t('notifications'), icon: '🔔' },
    { id: 'appearance', name: t('appearance'), icon: '🎨' },
    { id: 'security', name: t('security'), icon: '🔒' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t('settings')}</h2>
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                                           className={`w-full text-left p-3 rounded-lg transition-colors ${
                         activeTab === tab.id
                           ? 'bg-blue-50 text-blue-700 border border-blue-200'
                           : 'text-gray-800 hover:bg-gray-50'
                       }`}
                  >
                    <div className="flex items-center">
                      {tab.icon}
                      <span className="ml-3">{tab.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {tabs.find(t => t.id === activeTab)?.name}
                </h2>
              </div>
              <div className="p-6">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">{t('generalPreferences')}</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                                                         <label className="text-sm font-medium text-gray-800">{t('language')}</label>
                             <p className="text-xs text-gray-600">{t('languageDescription')}</p>
                          </div>
                                                     <select
                             value={settings.language}
                             onChange={(e) => handleSettingChange('language', e.target.value)}
                             className="px-3 py-2 border border-gray-400 rounded-md text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                           >
                                                         <option value="en">English</option>
                             <option value="th">ไทย</option>
                             <option value="ja">日本語</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                                                         <label className="text-sm font-medium text-gray-800">{t('timezone')}</label>
                             <p className="text-xs text-gray-600">{t('timezoneDescription')}</p>
                          </div>
                                                     <select
                             value={settings.timezone}
                             onChange={(e) => handleSettingChange('timezone', e.target.value)}
                             className="px-3 py-2 border border-gray-400 rounded-md text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                           >
                            <option value="Asia/Bangkok">Asia/Bangkok</option>
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">America/New_York</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                                                         <label className="text-sm font-medium text-gray-800">{t('autoSave')}</label>
                             <p className="text-xs text-gray-600">{t('autoSaveDescription')}</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('autoSave', !settings.autoSave)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.autoSave ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">{t('notificationPreferences')}</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                                                         <label className="text-sm font-medium text-gray-800">{t('pushNotifications')}</label>
                             <p className="text-xs text-gray-600">{t('pushNotificationsDescription')}</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('notifications', !settings.notifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.notifications ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.notifications ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                                                         <label className="text-sm font-medium text-gray-800">{t('emailAlerts')}</label>
                             <p className="text-xs text-gray-600">{t('emailAlertsDescription')}</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('emailAlerts', !settings.emailAlerts)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.emailAlerts ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.emailAlerts ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">{t('appearanceSettings')}</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                                                         <label className="text-sm font-medium text-gray-800">{t('darkMode')}</label>
                             <p className="text-xs text-gray-600">{t('darkModeDescription')}</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('darkMode', !settings.darkMode)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.darkMode ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                                                     <h4 className="text-sm font-medium text-gray-800 mb-2">{t('themePreview')}</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <button className="p-3 border-2 border-blue-500 rounded-lg bg-white">
                                                             <div className="text-sm font-medium text-gray-900">{t('lightTheme')}</div>
                               <div className="text-xs text-gray-600">{t('current')}</div>
                            </button>
                            <button className="p-3 border-2 border-gray-200 rounded-lg bg-gray-800 text-white">
                                                             <div className="text-sm font-medium">{t('darkTheme')}</div>
                               <div className="text-xs text-gray-300">{t('comingSoon')}</div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">{t('securitySettings')}</h3>
                      <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">{t('securityNotice')}</h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>{t('securityNoticeDescription')}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                                             <div className="text-sm font-medium text-gray-900">{t('twoFactorAuth')}</div>
                               <div className="text-xs text-gray-600">{t('twoFactorAuthDescription')}</div>
                            </div>
                            <button className="text-sm text-blue-600 hover:text-blue-500">{t('enable')}</button>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                                             <div className="text-sm font-medium text-gray-900">{t('passwordChange')}</div>
                               <div className="text-xs text-gray-600">{t('passwordChangeDescription')}</div>
                            </div>
                            <button className="text-sm text-blue-600 hover:text-blue-500">{t('change')}</button>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                                             <div className="text-sm font-medium text-gray-900">{t('sessionManagement')}</div>
                               <div className="text-xs text-gray-600">{t('sessionManagementDescription')}</div>
                            </div>
                            <button className="text-sm text-blue-600 hover:text-blue-500">{t('view')}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 