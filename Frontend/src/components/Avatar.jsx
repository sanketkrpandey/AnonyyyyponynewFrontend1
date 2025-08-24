import React from 'react';

export default function Avatar({ src, name, size = 32 }) {
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Anonymous')}&background=0A70F2&color=fff&size=${size}`;
  
  return (
    <img 
      src={src || fallbackUrl} 
      alt={name || 'Avatar'} 
      className="rounded-full object-cover" 
      style={{ width: size, height: size }}
      onError={(e) => {
        e.target.src = fallbackUrl;
      }}
    />
  );
}