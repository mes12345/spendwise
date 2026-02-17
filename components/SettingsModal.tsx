
import React, { useState, useRef } from 'react';
import { Target, Check, Download, Upload, ShieldCheck, Database, X } from 'lucide-react';

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
        onImport(json);
      } catch (err) {
        alert("Failed to parse the backup file. Please ensure it's a valid SpendWise JSON export.");
      }
    };
    reader.readAsText(file);
    // Clear input so same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 ios-blur flex flex-col justify-end animate-in fade-in duration-300">
      <div className="bg-[#F2F2F7] w-full max-h-[95vh] rounded-t-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[env(safe-area-inset-bottom,0px)]">
        
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100 bg-white flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 active:scale-90 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-88px)] space-y-8">
          
          {/* Budget Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-purple-600" />
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Financial Goal</h3>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-500 mb-6 text-sm">Set your target monthly spending limit.</p>
              <div className="relative mb-6">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-300">$</span>
                <input 
                  type="number"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-full bg-gray-50 rounded-2xl py-6 pl-14 pr-6 text-4xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <button 
                onClick={() => onUpdateBudget(parseFloat(val) || 0)}
                className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Check size={20} />
                Save Budget
              </button>
            </div>
          </section>

          {/* Backup Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Data & Backup</h3>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <p className="text-gray-500 text-sm leading-relaxed">
                Your data is stored locally on your device. Export a backup to save your history externally.
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={onExport}
                  className="w-full bg-blue-50 text-blue-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-blue-100"
                >
                  <Download size={20} />
                  Export JSON Backup
                </button>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gray-50 text-gray-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-gray-100"
                >
                  <Upload size={20} />
                  Import Backup File
                </button>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
              
              <div className="flex items-center gap-2 pt-2 text-[10px] text-gray-400 italic">
                <ShieldCheck size={12} className="text-green-500" />
                <span>Imports will overwrite existing local data.</span>
              </div>
            </div>
          </section>

          <div className="text-center py-4">
            <p className="text-[10px] text-gray-300 font-bold tracking-widest uppercase">SpendWise v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
