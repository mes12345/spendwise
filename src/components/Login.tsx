import React from 'react';
import { LogIn, Shield } from 'lucide-react';
import { useAuth } from './FirebaseProvider';

const Login: React.FC = () => {
  const { signIn } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center bg-[#F2F2F7]">
      <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center shadow-2xl mb-8 animate-bounce-slow">
        <Shield size={40} className="text-white" />
      </div>
      
      <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">SpendWise</h1>
      <p className="text-gray-500 mb-12 max-w-[280px]">
        Your personal finance tracker, now with secure cloud sync. 
        Sign in to keep your data safe.
      </p>

      <button 
        onClick={signIn}
        className="w-full max-w-[280px] bg-white border border-gray-100 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all group hover:border-blue-500/20"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
        <span className="font-bold text-gray-700">Continue with Google</span>
      </button>

      <div className="mt-12 flex items-center gap-2 grayscale opacity-50">
        <LogIn size={14} className="text-blue-500" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure Cloud Storage</span>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
