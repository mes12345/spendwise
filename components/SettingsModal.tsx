
import React, { useState, useRef } from 'react';
import { Target, Check, Download, Upload, ShieldCheck, Database, X, ChevronRight } from 'lucide-react';

interface SettingsModalProps {
  currentBudget: number;
  onUpdateBudget: (val: number) => void;
  onExport: () => void;
  onImport: (data: any) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  currentBudget, 
  onUpdateBudget, 
  onExport, 
  onImport, 
  onClose 
}) => {
  const [val, setVal] = useState(currentBudget.toString());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (window.confirm("This will replace all your current transactions and budget with the data from this file. Are you sure?")) {
          onImport(json);
        }
      } catch (err) {
        alert("Failed to parse the backup file. Please ensure it's a valid SpendWise JSON export.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 ios-blur flex flex-col justify-end animate-in fade-in duration-300">
      <div 
        className="bg-[#F2F2F7] w-full max-h-[95vh] rounded-t-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col pb-[env(safe-area-inset-bottom,0px)]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Settings & Tools</h2>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 active:scale-90 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-10">
          
          {/* Section 1: Financial Goal */}
          <section>
            <div className="flex items-center gap-2 mb-4 px-1">
              <Target size={18} className="text-purple-600" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Spending Limit</h3>
            </div>
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100">
              <p className="text-gray-500 mb-6 text-sm leading-snug">Adjust your monthly spending target for the dashboard.</p>
              <div className="relative mb-6">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-300">$</span>
                <input 
                  type="number"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-full bg-gray-50 rounded-2xl py-5 pl-12 pr-6 text-3xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="0.00"
                />
              </div>
              <button 
                onClick={() => onUpdateBudget(parseFloat(val) || 0)}
                className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Check size={18} />
                Update Target
              </button>
            </div>
          </section>

          {/* Section 2: Data & Backup */}
          <section>
            <div className="flex items-center gap-2 mb-4 px-1">
              <Database size={18} className="text-blue-600" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Data Management</h3>
            </div>
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-50 mb-2">
                <p className="text-blue-600 text-xs leading-relaxed font-medium">
                  Your data is 100% private and stays on this device. Create a backup to transfer it or save it forever.
                </p>
              </div>
              
              <button 
                onClick={onExport}
                className="w-full bg-white text-blue-600 font-bold py-4 px-5 rounded-2xl flex items-center justify-between active:scale-95 transition-all border border-gray-100 hover:bg-gray-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Download size={18} />
                  </div>
                  <span className="text-sm">Export My Transactions</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white text-gray-600 font-bold py-4 px-5 rounded-2xl flex items-center justify-between active:scale-95 transition-all border border-gray-100 hover:bg-gray-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                    <Upload size={18} />
                  </div>
                  <span className="text-sm">Restore from Backup</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
              
              <div className="flex items-center gap-2 pt-2 px-1">
                <ShieldCheck size={12} className="text-green-500" />
                <span className="text-[10px] text-gray-400 italic">Secure, local-only processing.</span>
              </div>
            </div>
          </section>

          <div className="text-center pt-4 pb-8">
            <p className="text-[10px] text-gray-300 font-bold tracking-widest uppercase">SpendWise Pro • Privacy First</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
