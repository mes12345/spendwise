
import React from 'react';
import { Lock, LogOut, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './FirebaseProvider';

const AccessDenied: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-screen px-10 text-center bg-slate-50 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-100/40 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="relative z-10"
      >
        <div className="w-24 h-24 bg-red-600 rounded-[36px] flex items-center justify-center shadow-2xl shadow-red-200 mb-10 relative group">
          <div className="absolute inset-0 bg-red-400 rounded-[36px] blur-xl opacity-20" />
          <Lock size={48} className="text-white relative z-10" />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Access Denied</h1>
        <p className="text-slate-500 mb-2 max-w-[280px] text-sm font-medium leading-relaxed">
          Your email <span className="text-red-600 font-bold">{user?.email}</span> is not on the trusted list for this application.
        </p>
        <p className="text-slate-400 mb-12 max-w-[280px] text-xs leading-relaxed">
          Please contact the administrator or sign in with an authorized account.
        </p>

        <button 
          onClick={logout}
          className="w-full max-w-[300px] bg-slate-900 text-white py-4 px-6 rounded-2xl flex items-center justify-center gap-4 shadow-2xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all group"
        >
          <LogOut size={18} />
          <span className="font-bold text-sm tracking-tight">Sign Out</span>
        </button>

        <div className="mt-10 flex items-center justify-center gap-2">
          <Mail size={12} className="text-red-500" />
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Authorized Personnel Only</span>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessDenied;
