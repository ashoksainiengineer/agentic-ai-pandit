'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BirthData, LifeEvent, SpouseData, TimeOffsetConfig } from '@/lib/types';
import { Clock, MapPin, Calendar, User, Globe } from 'lucide-react';
import { EVENT_CATEGORIES } from '@/lib/events/categories';
import { getCategoryById } from '@/lib/events/utils';

interface Step3ReviewProps {
  data: BirthData;
  events: LifeEvent[];
  spouseData?: SpouseData;
  onSubmit: () => void;
  isSubmitting: boolean;
  onEdit: (step: number) => void;
  offsetConfig?: TimeOffsetConfig;
}

// ── Tiny helpers ────────────────────────────────────────────────────────────

const getCategoryIcon = (categoryId: string): string => {
  const cat = getCategoryById(EVENT_CATEGORIES, categoryId);
  return cat?.icon || '📅';
};

const imp = (level: string) => {
  const m: Record<string, string> = {
    critical: 'bg-[#C65D3B]/10 text-[#C65D3B]',
    high:     'bg-amber-50 text-amber-700',
    medium:   'bg-[#184131]/10 text-[#184131]',
    low:      'bg-stone-100 text-stone-500',
  };
  return m[level] || m.low;
};

const prec = (p?: string) => {
  const m: Record<string, string> = {
    exact_date_time: 'Exact date & time',
    exact_date: 'Exact date',
    month_year: 'Month & year',
    year_range: 'Year',
    date_range: 'Date range',
  };
  return p ? (m[p] || p) : '—';
};

const coord = (v: number | undefined | null) =>
  v != null && !isNaN(v) ? v.toFixed(4) + '°' : '—';

// ── Component ───────────────────────────────────────────────────────────────

export default function Step3Review({
  data, events, spouseData, onSubmit, isSubmitting, onEdit, offsetConfig,
}: Step3ReviewProps) {
  const showSpouse = !!(spouseData?.name || spouseData?.dateOfBirth || spouseData?.birthTime || spouseData?.birthPlace);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* ── Heading ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="pt-6 pb-2 text-center"
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-full text-[10px] font-semibold text-[var(--prism-graphite)] tracking-[0.2em] mb-4">
          STEP 3 OF 3
        </span>
        <h2 className="text-2xl font-semibold text-[var(--prism-ink)]">
          Almost there — review your details
        </h2>
      </motion.div>

      {/* ── Quick stats ───────────────────────────────────────────────────── */}
      <div className="flex divide-x divide-black/[0.06] bg-[var(--prism-canvas)] rounded-xl border border-black/[0.04]">
        <Stat n={events.length} label="Events" />
        <Stat n={new Set(events.map(e => e.category)).size} label="Categories" />
        <Stat n={events.filter(e => e.importance === 'critical' || e.importance === 'high').length} label="Key events" />
        <Stat n={showSpouse ? 'Yes' : '—'} label="Spouse" />
      </div>

      {/* ── Birth details ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3 }}
        className="bg-white rounded-xl border border-black/[0.06] shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.04]">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[var(--prism-graphite)]" />
            <h3 className="text-sm font-semibold text-[var(--prism-ink)]">Birth details</h3>
          </div>
          <button onClick={() => onEdit(1)} className="text-xs text-[var(--prism-graphite)] hover:text-[var(--prism-ink)] transition-colors">
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <Cell label="Full name"     value={data.fullName || '—'} />
          <Cell label="Date of birth" value={data.dateOfBirth || '—'} />
          <Cell label="Approx. time"  value={data.tentativeTime || '—'} icon={<Clock className="w-3 h-3" />} />
          <Cell label="Gender"        value={data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1) : '—'} />
          <Cell label="Birth place"   value={data.birthPlace || '—'} icon={<MapPin className="w-3 h-3" />} full />
          <Cell label="Coordinates"   value={`${coord(data.latitude)}, ${coord(data.longitude)}`} />
          <Cell label="Timezone"      value={data.timezone != null ? `UTC${data.timezone >= 0 ? '+' : ''}${data.timezone}` : '—'} icon={<Globe className="w-3 h-3" />} />
          {offsetConfig && (
            <Cell
              label="Uncertainty"
              value={offsetConfig.preset === 'custom'
                ? `±${offsetConfig.customMinutes || '?'} min`
                : offsetConfig.description || offsetConfig.preset || '—'}
            />
          )}
        </div>
      </motion.div>

      {/* ── Spouse details ─────────────────────────────────────────────────── */}
      {showSpouse && (
        <div className="bg-white rounded-xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.04]">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[var(--prism-graphite)]" />
              <h3 className="text-sm font-semibold text-[var(--prism-ink)]">Spouse details</h3>
            </div>
            <button onClick={() => onEdit(1)} className="text-xs text-[var(--prism-graphite)] hover:text-[var(--prism-ink)] transition-colors">
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {spouseData?.name && <Cell label="Name" value={spouseData.name} />}
            {spouseData?.dateOfBirth && <Cell label="Date of birth" value={spouseData.dateOfBirth} />}
            {spouseData?.birthTime && <Cell label="Birth time" value={spouseData.birthTime} />}
            {spouseData?.birthPlace && <Cell label="Birth place" value={spouseData.birthPlace} full />}
            {spouseData?.latitude != null && spouseData?.longitude != null && (
              <Cell label="Coordinates" value={`${coord(spouseData.latitude)}, ${coord(spouseData.longitude)}`} />
            )}
            {spouseData?.timezone != null && (
              <Cell label="Timezone" value={`UTC${Number(spouseData.timezone) >= 0 ? '+' : ''}${spouseData.timezone}`} />
            )}
          </div>
        </div>
      )}

      {/* ── Life events table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-black/[0.06] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.04]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[var(--prism-graphite)]" />
            <h3 className="text-sm font-semibold text-[var(--prism-ink)]">Life events</h3>
            <span className="text-[10px] text-[var(--prism-slate)] bg-black/[0.04] px-2 py-0.5 rounded-full font-medium">
              {events.length}
            </span>
          </div>
          <button onClick={() => onEdit(2)} className="text-xs text-[var(--prism-graphite)] hover:text-[var(--prism-ink)] transition-colors">
            Edit
          </button>
        </div>

        {events.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[var(--prism-graphite)]">
              No events added yet — at least 3 are needed for accurate analysis.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.04]">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--prism-slate)] tracking-[0.15em] uppercase w-10">#</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--prism-slate)] tracking-[0.15em] uppercase">Event</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--prism-slate)] tracking-[0.15em] uppercase hidden sm:table-cell">Date</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--prism-slate)] tracking-[0.15em] uppercase hidden md:table-cell">Precision</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--prism-slate)] tracking-[0.15em] uppercase">Weight</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, i) => (
                  <tr
                    key={event.id}
                    className="border-b border-black/[0.03] last:border-0 hover:bg-[var(--prism-canvas)]/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-[var(--prism-slate)] tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{getCategoryIcon(event.category)}</span>
                        <span className="text-sm font-medium text-[var(--prism-ink)]">{event.eventType}</span>
                        {event.isCustom && (
                          <span className="text-[10px] text-[var(--prism-slate)] ml-1">· custom</span>
                        )}
                      </div>
                      <div className="sm:hidden flex items-center gap-2 mt-0.5 text-xs text-[var(--prism-graphite)]">
                        <span>{event.eventDate}</span>
                        {event.eventTime && <span className="text-[var(--prism-slate)]">{event.eventTime}</span>}
                        <span className="text-[var(--prism-pebble)]">·</span>
                        <span>{prec(event.datePrecision)}</span>
                      </div>
                      {event.description && (
                        <p className="text-xs text-[var(--prism-graphite)] mt-0.5 line-clamp-1 max-w-[300px]">
                          {event.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="text-xs text-[var(--prism-ink)]/80">{event.eventDate}</div>
                      {event.eventTime && (
                        <div className="text-[10px] text-[var(--prism-graphite)]">{event.eventTime}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-[var(--prism-graphite)]">{prec(event.datePrecision)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${imp(event.importance)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${event.importance === 'critical' ? 'bg-[#C65D3B]' : event.importance === 'high' ? 'bg-amber-500' : event.importance === 'medium' ? 'bg-[#184131]' : 'bg-stone-400'}`} />
                        {event.importance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex gap-3 pt-1"
      >
        <button
          onClick={() => onEdit(1)}
          className="px-5 py-2.5 border border-black/[0.08] text-sm text-[var(--prism-graphite)] rounded-xl font-medium hover:border-black/20 hover:text-[var(--prism-ink)] transition-all"
        >
          Go back & edit
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-2.5 bg-[var(--prism-ink)] text-white text-sm rounded-xl font-semibold hover:bg-black/85 transition-all disabled:opacity-40"
        >
          {isSubmitting ? 'Submitting…' : 'Submit for analysis'}
        </button>
      </motion.div>
    </div>
  );
}

// ── Reusable bits ───────────────────────────────────────────────────────────

function Cell({ label, value, icon, full }: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`px-5 py-3 border-b border-black/[0.03] last:border-0 ${full ? 'sm:col-span-2' : ''}`}>
      <div className="text-[10px] font-semibold text-[var(--prism-slate)] tracking-[0.15em] uppercase mb-0.5">
        {label}
      </div>
      <div className="text-sm text-[var(--prism-ink)]/85 flex items-center gap-1.5">
        {icon}
        {value}
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="flex-1 py-3 text-center">
      <div className="text-lg font-bold text-[var(--prism-ink)] tabular-nums">{n}</div>
      <div className="text-[10px] text-[var(--prism-slate)] font-medium tracking-[0.1em] uppercase">
        {label}
      </div>
    </div>
  );
}
