import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Activity, Server, Users } from 'lucide-react';
import { auth } from '../firebase';
import { useAppTheme } from '../context/ThemeContext';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const { themeConfig } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    const fetchAdminStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated.');
        
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(response.status === 403 || response.status === 401 ? 'Unauthorized: You do not have admin privileges.' : `Failed to fetch stats (${response.status})`);
        }
        
        const data = await response.json();
        if (isMounted) setStats(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Unknown error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchAdminStats();
    
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-black/50">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${themeConfig.primaryGradient} flex items-center justify-center text-neutral-950 font-bold shadow-md`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold text-neutral-100 flex items-center space-x-2">
                <span>Admin Dashboard</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                  Elevated Access
                </span>
              </h2>
              <p className="text-xs text-neutral-400">System Monitoring & Analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-8 h-8 border-3 border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
                <p className="text-sm text-neutral-400">Verifying RBAC Permissions...</p>
             </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif text-white">Access Denied</h3>
              <p className="text-sm text-neutral-400">
                {error}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start space-x-4">
                <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400 mb-1">RBAC Verification Successful</h4>
                  <p className="text-xs text-emerald-400/80 font-mono">{stats?.message || 'Elevated admin access granted.'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="p-5 border border-neutral-800 rounded-2xl bg-neutral-950 flex flex-col space-y-2">
                   <div className="flex items-center space-x-2 text-neutral-400 mb-2">
                     <Users className="w-4 h-4" />
                     <span className="text-xs font-medium uppercase tracking-wider">Active Users</span>
                   </div>
                   <span className="text-3xl font-light text-white font-mono">1</span>
                   <span className="text-xs text-emerald-400 flex items-center">
                     +100% from last month
                   </span>
                 </div>
                 
                 <div className="p-5 border border-neutral-800 rounded-2xl bg-neutral-950 flex flex-col space-y-2">
                   <div className="flex items-center space-x-2 text-neutral-400 mb-2">
                     <Server className="w-4 h-4" />
                     <span className="text-xs font-medium uppercase tracking-wider">System Health</span>
                   </div>
                   <span className="text-3xl font-light text-white font-mono">100%</span>
                   <span className="text-xs text-emerald-400 flex items-center">
                     All services operational
                   </span>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
