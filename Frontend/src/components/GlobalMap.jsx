import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function GlobalMap({ locations = [], width = '100%', height = 320 }){
  // center roughly at 20,0 and adjust zoom to show global
  const center = [20, 0];

  // ensure the leaflet CSS is present (for some build pipelines)
  useEffect(() => {
    // nothing required; CSS imported above
  }, []);

  return (
    <div className="global-map" style={{ width: width, height: '100%' }}>
      <MapContainer center={center} zoom={2} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {(locations || []).map((loc, idx) => (
          <CircleMarker 
            key={loc.id || idx} 
            center={[loc.lat || 0, loc.lng || 0]} 
            radius={8} 
            pathOptions={{ color: '#6366f1', fillColor: '#818cf8', fillOpacity: 0.8, weight: 2 }}
          >
            <Popup>
              <div style={{minWidth:140}}>
                <div style={{fontWeight:600, color:'#1e293b'}}>{loc.name || loc.label || 'Unknown'}</div>
                <div style={{fontSize:12, color:'#64748b'}}>{loc.status || 'Active'}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
