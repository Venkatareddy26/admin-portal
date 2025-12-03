 import React, { useState, useEffect } from 'react';

const DEFAULT = ['tripFrequency','topDestinations','riskFeed'];

export default function WidgetManager({ onChange, initial }){
  const [widgets, setWidgets] = useState(() => {
    try{
      const raw = localStorage.getItem('dashboard_widgets');
      if(raw) return JSON.parse(raw);
    }catch{}
    return initial || DEFAULT;
  });

  useEffect(() => {
    try{ localStorage.setItem('dashboard_widgets', JSON.stringify(widgets)); }catch{}
    onChange && onChange(widgets);
  }, [widgets]);

  function toggle(id){
    setWidgets(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
  }

  return (
    <div className="widget-manager space-y-3">
      {[
        { id: 'tripFrequency', label: 'Trip frequency', icon: '📊' },
        { id: 'topDestinations', label: 'Top destinations', icon: '📍' },
        { id: 'riskFeed', label: 'Risk alerts', icon: '⚠️' },
      ].map(item => (
        <label key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-sm">{item.icon}</span>
            <span className="text-sm text-gray-700">{item.label}</span>
          </div>
          <input 
            type="checkbox" 
            checked={widgets.includes(item.id)} 
            onChange={() => toggle(item.id)}
            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
        </label>
      ))}
    </div>
  );
}
