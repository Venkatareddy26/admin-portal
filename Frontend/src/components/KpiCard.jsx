import React from 'react';

export default function KpiCard({ title, value, subtitle, icon, onClick, small }){
  const Vr = small ? 'text-lg' : 'text-2xl';
  return (
    <div className={`elevated p-3 flex flex-col items-center ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="flex items-center gap-3 w-full">
        <div className="rounded-full bg-slate-900 text-white w-10 h-10 flex items-center justify-center">{icon || '•'}</div>
        <div className="flex-1 text-left">
          <div className="text-sm text-muted">{title}</div>
          <div className={`${Vr} font-semibold`}>{typeof value === 'number' ? (value).toLocaleString() : value}</div>
        </div>
      </div>
      {subtitle && <div className="text-xs text-gray-500 mt-2">{subtitle}</div>}
    </div>
  );
}
