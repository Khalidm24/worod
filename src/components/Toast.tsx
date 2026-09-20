import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-800 flex items-center gap-3 animate-slideUp">
      <CheckCircle2 className="w-5 h-5 text-rose-300 shrink-0" />
      <span className="text-xs sm:text-sm font-semibold">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-emerald-900 rounded-lg text-emerald-300 hover:text-white transition-colors"
        aria-label="إغلاق"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
