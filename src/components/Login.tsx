
import React from 'react';
import { LogIn, Shield, Wallet, Sparkles } from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const { signIn } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-screen px-10 text-center bg-slate-50 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="relative z-10"
      >
        <div className="w-24 h-24 bg-indigo-600 rounded-[36px] flex items-center justify-center shadow-2xl shadow-indigo-200 mb-10 relative group">
          <div className="absolute inset-0 bg-indigo-400 rounded-[36px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <Wallet size={48} className="text-white relative z-10" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -top-2 -right-2 p-2 bg-white rounded-full shadow-lg"
          >
            <Sparkles size={16} className="text-indigo-600" />
          </motion.div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">SpendWise</h1>
        <p className="text-slate-400 mb-12 max-w-[260px] text-sm font-medium leading-relaxed">
          The high-performance expense tracker for modern financial clarity.
        </p>

        <button 
          onClick={signIn}
          className="w-full max-w-[300px] bg-slate-900 text-white py-4.5 px-6 rounded-2xl flex items-center justify-center gap-4 shadow-2xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:animate-shimmer" />
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 bg-white p-0.5 rounded-full" />
          <span className="font-bold text-sm tracking-tight">Continue with Google</span>
        </button>

        <div className="mt-10 flex items-center justify-center gap-2">
          <Shield size={12} className="text-indigo-500" />
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Bank-Grade Security</span>
        </div>
      </motion.div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
