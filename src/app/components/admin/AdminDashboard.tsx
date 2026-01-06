import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ThemeToggle } from '../ThemeToggle';
import { UserApprovalPanel } from './UserApprovalPanel';
import { SystemSettingsPanel } from './SystemSettingsPanel';
import { MonitoringPanel } from './MonitoringPanel';
import { Users, Settings, Activity, LogOut, FileText } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  userEmail: string;
  accessToken: string;
  onSwitchToConverter?: () => void;
}

type AdminPanel = 'approval' | 'settings' | 'monitoring';

export function AdminDashboard({ onLogout, userEmail, accessToken, onSwitchToConverter }: AdminDashboardProps) {
  const [activePanel, setActivePanel] = useState<AdminPanel>('approval');

  const panels = [
    {
      id: 'approval' as AdminPanel,
      title: 'User Approvals',
      description: 'Review and approve pending user registrations',
      icon: Users,
      color: 'bg-blue-500 dark:bg-blue-600',
    },
    {
      id: 'settings' as AdminPanel,
      title: 'System Settings',
      description: 'Manage default values and system configuration',
      icon: Settings,
      color: 'bg-green-500 dark:bg-green-600',
    },
    {
      id: 'monitoring' as AdminPanel,
      title: 'System Monitoring',
      description: 'View users, database status, and activity',
      icon: Activity,
      color: 'bg-purple-500 dark:bg-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Logged in as: {userEmail}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {onSwitchToConverter && (
                <Button
                  onClick={onSwitchToConverter}
                  variant="outline"
                  className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 border-0 focus:ring-2 focus:ring-blue-500"
                  aria-label="Switch to file converter"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  File Converter
                </Button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
                <ThemeToggle />
              </div>
              <Button
                variant="outline"
                className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 border-0"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Panel Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {panels.map((panel) => {
            const Icon = panel.icon;
            const isActive = activePanel === panel.id;
            
            return (
              <Card
                key={panel.id}
                className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                  isActive 
                    ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-950' 
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
                onClick={() => setActivePanel(panel.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${panel.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {panel.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {panel.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Active Panel Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {activePanel === 'approval' && (
            <UserApprovalPanel accessToken={accessToken} />
          )}
          {activePanel === 'settings' && (
            <SystemSettingsPanel accessToken={accessToken} />
          )}
          {activePanel === 'monitoring' && (
            <MonitoringPanel accessToken={accessToken} />
          )}
        </div>
      </div>
    </div>
  );
}