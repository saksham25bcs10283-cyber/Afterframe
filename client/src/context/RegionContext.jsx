import React, { createContext, useContext, useState, useEffect } from 'react';

const RegionContext = createContext();

export const REGIONS = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
];

export const RegionProvider = ({ children }) => {
  const [region, setRegion] = useState(() => {
    return localStorage.getItem('afterframe-region') || 'IN';
  });

  useEffect(() => {
    localStorage.setItem('afterframe-region', region);
  }, [region]);

  const currentRegion = REGIONS.find(r => r.code === region) || REGIONS[0];

  return (
    <RegionContext.Provider value={{ region, setRegion, currentRegion, allRegions: REGIONS }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => useContext(RegionContext);
