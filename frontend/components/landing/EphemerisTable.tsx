'use client';

import React from 'react';
import { motion } from 'framer-motion';

const PLANET_DATA = [
  { planet: 'Sun', sign: 'Leo', longitude: '125.42°', house: '5th', retro: false },
  { planet: 'Moon', sign: 'Scorpio', longitude: '218.91°', house: '8th', retro: false },
  { planet: 'Mars', sign: 'Aries', longitude: '15.67°', house: '1st', retro: false },
  { planet: 'Jupiter', sign: 'Taurus', longitude: '45.18°', house: '11th', retro: true },
  { planet: 'Saturn', sign: 'Capricorn', longitude: '298.33°', house: '10th', retro: false },
];

export default function EphemerisTable() {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-3 h-3 bg-[#4A7C6F] rounded-full animate-pulse" />
        <span className="text-sm font-medium text-[#959595]">Ephemeris Data (Skyfield)</span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-5 gap-2 pb-2 border-b border-[rgba(0,0,0,0.06)] mb-3">
        <span className="text-[10px] font-medium text-[#959595] uppercase tracking-wider">Planet</span>
        <span className="text-[10px] font-medium text-[#959595] uppercase tracking-wider">Sign</span>
        <span className="text-[10px] font-medium text-[#959595] uppercase tracking-wider">Longitude</span>
        <span className="text-[10px] font-medium text-[#959595] uppercase tracking-wider">House</span>
        <span className="text-[10px] font-medium text-[#959595] uppercase tracking-wider">Motion</span>
      </div>

      {/* Rows */}
      <div className="space-y-0.5">
        {PLANET_DATA.map((row, i) => (
          <motion.div
            key={row.planet}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            className="grid grid-cols-5 gap-2 py-2 text-xs rounded-md hover:bg-[rgba(0,0,0,0.02)] transition-colors"
          >
            <span className="text-[#636363] font-medium">{row.planet}</span>
            <span className="text-[#636363]">{row.sign}</span>
            <span className="text-[#636363] font-mono">{row.longitude}</span>
            <span className="text-[#636363]">{row.house}</span>
            <span
              className={
                row.retro
                  ? 'text-[#B8860B] text-[10px] font-medium'
                  : 'text-[#959595] text-[10px]'
              }
            >
              {row.retro ? 'RETRO' : 'direct'}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between text-[10px] text-[#959595]">
        <span>NASA JPL DE440</span>
        <span className="font-mono">±0.0001°</span>
      </div>
    </div>
  );
}
