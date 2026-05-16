import React from 'react';
import { Compass } from 'lucide-react';
import type { EphemerisData, DivisionalChart, PlanetPosition } from '@ai-pandit/shared';

interface PlanetaryProps {
    ephemeris: EphemerisData;
    divCharts: Record<string, DivisionalChart>;
}

export const PlanetaryVitals: React.FC<PlanetaryProps> = ({ ephemeris, divCharts }) => {
    const planets = Object.entries(ephemeris.planets) as [string, PlanetPosition][];

    return (
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-6 h-full">
            <h4 className="text-black font-medium mb-6 flex items-center gap-2">
                <Compass className="w-4 h-4 text-black" />
                Planetary Vitals (Nirayana)
            </h4>

            <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                    <thead>
                        <tr className="border-b border-[rgba(0,0,0,0.08)] text-black/60">
                            <th className="py-2 text-left">Planet</th>
                            <th className="py-2 text-left">Sign</th>
                            <th className="py-2 text-right">Arc-Sec Precision</th>
                            <th className="py-2 text-right">D9</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-[rgba(0,0,0,0.08)]/50 hover:bg-[var(--prism-canvas)]">
                            <td className="py-3 text-black font-medium">ASCENDANT</td>
                            <td className="py-3 text-black">{ephemeris.ascendant.sign}</td>
                            <td className="py-3 text-right text-black/60">{(ephemeris.ascendant.longitude % 30).toFixed(6)}°</td>
                            <td className="py-3 text-right text-black">{divCharts.D9.ascendant.sign.slice(0, 3)}</td>
                        </tr>
                        {planets.map(([name, data]) => (
                            <tr key={name} className="border-b border-[rgba(0,0,0,0.08)]/50 hover:bg-[var(--prism-canvas)]">
                                <td className="py-2 text-black capitalize">{name}</td>
                                <td className="py-2 text-black/60">{data.sign}</td>
                                <td className="py-2 text-right text-black">{(data.longitude % 30).toFixed(4)}°</td>
                                <td className="py-2 text-right text-black/60">{divCharts.D9.planets[name]?.sign.slice(0, 3) || '??'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex gap-4">
                <div className="flex-1 bg-[#ffffff] p-3 rounded-lg border border-[rgba(0,0,0,0.08)] text-center">
                    <div className="text-[10px] text-black/60 uppercase mb-1">D10 Lagnat</div>
                    <div className="text-black font-medium">{divCharts.D10.ascendant.sign}</div>
                </div>
                <div className="flex-1 bg-[#ffffff] p-3 rounded-lg border border-[rgba(0,0,0,0.08)] text-center">
                    <div className="text-[10px] text-black/60 uppercase mb-1">D60 Amsha</div>
                    <div className="text-black font-medium">{divCharts.D60?.ascendant.sign || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
};
