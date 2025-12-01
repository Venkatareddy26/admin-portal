import React, { useEffect, useState } from 'react';

export default function RiskFeed({ pollInterval = 15000 }){
  const [items, setItems] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let mounted = true;
    function fetchMock(){
      // mock items
      const now = new Date();
      const mock = [
        { id: 'who-1', source: 'WHO', timestamp: now.toISOString(), severity: 'moderate', region: 'Europe', summary: 'Localized outbreak advisory in Region X', link: '#' },
        { id: 'cdc-1', source: 'CDC', timestamp: now.toISOString(), severity: 'low', region: 'North America', summary: 'Travel advisory updated for Country Y', link: '#' },
      ];
      if(!mounted) return;
      setItems(mock);
      setLastUpdated(new Date());
    }
    fetchMock();
    const t = setInterval(fetchMock, pollInterval);
    return () => { mounted = false; clearInterval(t); };
  }, [pollInterval]);

  const severityColors = {
    low: { bg: '#dcfce7', text: '#166534' },
    moderate: { bg: '#fef3c7', text: '#92400e' },
    high: { bg: '#fee2e2', text: '#991b1b' },
  };

  return (
    <div className="risk-feed p-4 space-y-3">
      {items.map(it => {
        const colors = severityColors[it.severity] || severityColors.moderate;
        return (
          <div key={it.id} className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-gray-50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 leading-tight">{it.summary}</div>
                <div className="text-xs text-gray-500 mt-1">{it.source} • {it.region}</div>
              </div>
              <span 
                className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {it.severity}
              </span>
            </div>
          </div>
        );
      })}
      {items.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-4">No active alerts</div>
      )}
    </div>
  );
}
