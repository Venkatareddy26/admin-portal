import React from 'react';

const ICON_GRADIENTS = {
  '✈️': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  '✈': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  '🏨': 'linear-gradient(135deg, #f59e0b, #d97706)',
  '🚗': 'linear-gradient(135deg, #10b981, #059669)',
  '💰': 'linear-gradient(135deg, #ec4899, #db2777)',
  '📋': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  '🧾': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  '👥': 'linear-gradient(135deg, #06b6d4, #0891b2)',
  '📍': 'linear-gradient(135deg, #f59e0b, #d97706)',
  '⏱': 'linear-gradient(135deg, #10b981, #059669)',
  '⏱️': 'linear-gradient(135deg, #10b981, #059669)',
  '✅': 'linear-gradient(135deg, #22c55e, #16a34a)',
  'default': 'linear-gradient(135deg, #6366f1, #8b5cf6)'
};

export default function KpiCard({ title, value, subtitle, icon, onClick, small }){
  const Vr = small ? 'text-xl' : 'text-2xl';
  const iconSize = small ? 'w-10 h-10 text-base' : 'w-12 h-12 text-xl';
  const gradient = ICON_GRADIENTS[icon] || ICON_GRADIENTS['default'];
  
  return (
    <div 
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`} 
      onClick={onClick} 
      role={onClick ? 'button' : undefined} 
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center gap-4">
        <div 
          className={`${iconSize} rounded-xl flex items-center justify-center shadow-sm`}
          style={{ background: gradient, color: 'white' }}
        >
          {icon || '•'}
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-500 font-medium">{title}</div>
          <div className={`${Vr} font-bold text-slate-800`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
          {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
