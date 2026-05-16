/**
 * WhyEventsMatter - Persuasive Guide for Users
 * Explains why more events = seconds-level accuracy
 * Sacred Ivory Light Theme - God Tier Design
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Target, Sparkles, ChevronDown, 
  TrendingUp, Zap, Award,
  Calendar, HeartPulse, Briefcase, Home, GraduationCap,
  Plane, Baby, Landmark, AlertTriangle
} from 'lucide-react';

interface WhyEventsMatterProps {
  currentEventCount: number;
  categoriesCovered: number;
}

const ACCURACY_LEVELS = [
  {
    range: '0-10 events',
    accuracy: '40-55%',
    precision: '±15-30 minutes',
    label: 'Basic Verification',
    color: 'text-[#C65D3B]',
    bgColor: 'bg-[#C65D3B]/10',
    borderColor: 'border-[#C65D3B]/30',
    icon: AlertTriangle,
    description: 'Not sufficient for precise rectification'
  },
  {
    range: '11-20 events',
    accuracy: '70-80%',
    precision: '±3-5 minutes',
    label: 'Good Progress',
    color: 'text-black',
    bgColor: 'bg-[#000000]/10',
    borderColor: 'border-[#000000]/30',
    icon: TrendingUp,
    description: 'Professional-grade accuracy'
  },
  {
    range: '21-30 events',
    accuracy: '88-95%',
    precision: '±10-60 seconds',
    label: 'Excellent Dataset',
    color: 'text-[#184131]',
    bgColor: 'bg-[#184131]/10',
    borderColor: 'border-[#184131]/30',
    icon: Award,
    description: 'Sub-minute precision achieved'
  },
  {
    range: '35+ events',
    accuracy: '96-99%',
    precision: '±1-10 seconds',
    label: 'God Tier Precision',
    color: 'text-black',
    bgColor: 'bg-gradient-to-r from-[#000000]/15 to-[#000000]/15',
    borderColor: 'border-[#000000]/40',
    icon: Sparkles,
    description: 'Research-grade seconds-level accuracy'
  }
];

const CATEGORY_IMPORTANCE = [
  {
    category: 'Career & Work',
    icon: Briefcase,
    events: '4-6 events',
    why: '10th house validation for professional timing',
    planets: 'Sun, Saturn, 10th Lord',
    examples: ['First job', 'Promotion', 'Job change', 'Business start', 'Major achievement']
  },
  {
    category: 'Marriage & Relationships',
    icon: HeartPulse,
    events: '3-5 events',
    why: '7th house precision for partnership timing',
    planets: 'Venus, Jupiter, 7th Lord',
    examples: ['Engagement', 'Marriage', 'Relationship milestones']
  },
  {
    category: 'Health & Medical',
    icon: HeartPulse,
    events: '3-4 events',
    why: '6th/8th house validation for health crises',
    planets: 'Saturn, Mars, 6th/8th Lords',
    examples: ['Major illness', 'Surgery', 'Hospitalization', 'Recovery']
  },
  {
    category: 'Property & Assets',
    icon: Home,
    events: '2-3 events',
    why: '4th house timing for real estate transactions',
    planets: 'Mars, 4th Lord',
    examples: ['Property purchase', 'House construction', 'Major move']
  },
  {
    category: 'Education',
    icon: GraduationCap,
    events: '2-3 events',
    why: '4th/5th/9th houses for academic timing',
    planets: 'Mercury, Jupiter, 5th Lord',
    examples: ['Graduation', 'Higher education', 'Major exam']
  },
  {
    category: 'Children & Family',
    icon: Baby,
    events: '2-3 events',
    why: '5th house validation for progeny timing',
    planets: 'Jupiter, 5th Lord',
    examples: ['Child birth', "Children's milestones"]
  },
  {
    category: 'Travel & Foreign',
    icon: Plane,
    events: '2-3 events',
    why: '3rd/9th/12th houses for travel timing',
    planets: 'Rahu, 9th/12th Lords',
    examples: ['Foreign travel', 'Relocation abroad', 'Pilgrimage']
  },
  {
    category: 'Spiritual & Religious',
    icon: Landmark,
    events: '2-3 events',
    why: '9th/12th houses for spiritual evolution',
    planets: 'Ketu, Jupiter, 9th Lord',
    examples: ['Initiation', 'Major spiritual event', 'Religious ceremony']
  }
];

export default function WhyEventsMatter({ currentEventCount, categoriesCovered }: WhyEventsMatterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'science'>('overview');

  const getCurrentLevel = () => {
    if (currentEventCount >= 35) return ACCURACY_LEVELS[3];
    if (currentEventCount >= 21) return ACCURACY_LEVELS[2];
    if (currentEventCount >= 11) return ACCURACY_LEVELS[1];
    return ACCURACY_LEVELS[0];
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = ACCURACY_LEVELS.find(level => {
    const minEvents = parseInt(level.range.split('-')[0]);
    return minEvents > currentEventCount;
  });

  const eventsToNextLevel = nextLevel ? parseInt(nextLevel.range.split('-')[0]) - currentEventCount : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#ffffff] to-white rounded-2xl border border-[#000000]/30 overflow-hidden shadow-lg shadow-[#000000]/5"
    >
      {/* Header - Always Visible */}
      <div 
        className="p-5 cursor-pointer hover:bg-[var(--prism-canvas)]/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#000000] to-[#000000]">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className=" text-xl font-medium text-black">
                Why Add More Events?
              </h3>
            </div>
            <p className="text-sm text-black/60 leading-relaxed">
              <span className="font-medium text-black">Seconds-level accuracy</span> requires 
              <span className="font-medium text-black"> 25-40+ events</span> across 
              <span className="font-medium text-black"> 10+ life categories</span>. 
              Each event is a data point that narrows your birth time.
            </p>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="p-2 rounded-lg bg-[var(--prism-canvas)] text-black/60"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </div>

        {/* Current Status Bar - Always Visible */}
        <div className="mt-4 flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${currentLevel.bgColor} ${currentLevel.color} border ${currentLevel.borderColor}`}>
            <currentLevel.icon className="w-3.5 h-3.5 inline mr-1" />
            {currentLevel.label}
          </div>
          <div className="flex-1 h-2 bg-[rgba(0,0,0,0.08)] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-black rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (currentEventCount / 40) * 100)}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <span className="text-sm font-medium text-black">{currentEventCount}/40</span>
        </div>

        {nextLevel && (
          <p className="mt-2 text-xs text-black/60">
            🎯 Add <span className="font-medium text-black">{eventsToNextLevel} more events</span> to reach 
            <span className={`font-medium ${nextLevel.color}`}> {nextLevel.label}</span> ({nextLevel.precision})
          </p>
        )}
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[rgba(0,0,0,0.08)]"
          >
            {/* Tab Navigation */}
            <div className="flex p-1 bg-[var(--prism-canvas)] mx-4 mt-4 rounded-xl">
              {([
                { id: 'overview', label: 'Overview', icon: Clock },
                { id: 'categories', label: 'Categories', icon: Calendar },
                { id: 'science', label: 'The Science', icon: Zap }
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-black/60 hover:text-black/60'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-5 max-h-[500px] overflow-y-auto">
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Accuracy Levels */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-black text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-black" />
                      Accuracy Progression
                    </h4>
                    <div className="grid gap-3">
                      {ACCURACY_LEVELS.map((level, idx) => {
                        const isCurrent = level.range === currentLevel.range;
                        const isPast = ACCURACY_LEVELS.indexOf(currentLevel) > idx;
                        
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border transition-all ${
                              isCurrent 
                                ? `${level.bgColor} ${level.borderColor} border-2` 
                                : isPast
                                  ? 'bg-[#184131]/5 border-[#184131]/20'
                                  : 'bg-white border-[rgba(0,0,0,0.08)] opacity-70'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${level.bgColor}`}>
                                  <level.icon className={`w-4 h-4 ${level.color}`} />
                                </div>
                                <div>
                                  <div className="font-medium text-sm text-black">{level.label}</div>
                                  <div className="text-xs text-black/60">{level.range}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-medium text-lg ${level.color}`}>{level.accuracy}</div>
                                <div className="text-xs text-black/60">{level.precision}</div>
                              </div>
                            </div>
                            {isCurrent && (
                              <div className="mt-2 pt-2 border-t border-[#000000]/20">
                                <p className="text-xs text-black/60">✓ Your current level</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-[rgba(0,0,0,0.08)] text-center">
                      <div className="text-2xl font-medium text-black">{currentEventCount}</div>
                      <div className="text-[10px] text-black/60 uppercase tracking-wider">Events Added</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[rgba(0,0,0,0.08)] text-center">
                      <div className="text-2xl font-medium text-black">{categoriesCovered}</div>
                      <div className="text-[10px] text-black/60 uppercase tracking-wider">Categories</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[rgba(0,0,0,0.08)] text-center">
                      <div className="text-2xl font-medium text-[#184131]">{Math.max(0, 25 - currentEventCount)}</div>
                      <div className="text-[10px] text-black/60 uppercase tracking-wider">To Optimal</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'categories' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <h4 className="font-medium text-black text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-black" />
                    Essential Life Categories
                  </h4>
                  <p className="text-xs text-black/60">
                    Each category validates different astrological houses and planetary periods
                  </p>
                  
                  <div className="space-y-3">
                    {CATEGORY_IMPORTANCE.map((cat, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-[rgba(0,0,0,0.08)]">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-[#000000]/10">
                            <cat.icon className="w-4 h-4 text-black" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-sm text-black">{cat.category}</h5>
                              <span className="text-xs font-medium text-black bg-[#000000]/10 px-2 py-0.5 rounded-full">
                                {cat.events}
                              </span>
                            </div>
                            <p className="text-xs text-black/60 mt-1">{cat.why}</p>
                            <p className="text-[10px] text-[#184131] mt-1">Planets: {cat.planets}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {cat.examples.map((ex, i) => (
                                <span key={i} className="text-[10px] bg-[var(--prism-canvas)] text-black/60 px-2 py-0.5 rounded">
                                  {ex}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'science' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <h4 className="font-medium text-black text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-black" />
                    The Mathematics of BTR
                  </h4>

                  <div className="p-4 bg-gradient-to-br from-[#000000]/5 to-[#000000]/5 rounded-xl border border-[#000000]/20">
                    <h5 className="font-medium text-black mb-2">Why 30+ Events?</h5>
                    <p className="text-sm text-black/60 leading-relaxed">
                      Each life event is triggered by specific planetary periods (Dasha). 
                      With only 5-7 events, we have limited data points to cross-reference. 
                      With 30+ events spanning multiple decades, we create a 
                      <span className="font-medium text-black"> redundant verification matrix</span> 
                      that can pinpoint birth time to the second.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-sm text-black">How Events Validate Birth Time:</h5>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[rgba(0,0,0,0.08)]">
                        <div className="w-6 h-6 rounded-full bg-[#000000] text-white flex items-center justify-center text-xs font-medium shrink-0">1</div>
                        <div>
                          <div className="font-medium text-sm text-black">Dasha Overlap Verification</div>
                          <p className="text-xs text-black/60">
                            Multiple events should align with the same planetary periods. 
                            If 15 events all point to Jupiter-Venus period, we confirm timing.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[rgba(0,0,0,0.08)]">
                        <div className="w-6 h-6 rounded-full bg-[#000000] text-white flex items-center justify-center text-xs font-medium shrink-0">2</div>
                        <div>
                          <div className="font-medium text-sm text-black">Multi-House Validation</div>
                          <p className="text-xs text-black/60">
                            Career events validate 10th house, Marriage validates 7th house, 
                            Health validates 6th/8th houses. All houses must align.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[rgba(0,0,0,0.08)]">
                        <div className="w-6 h-6 rounded-full bg-[#000000] text-white flex items-center justify-center text-xs font-medium shrink-0">3</div>
                        <div>
                          <div className="font-medium text-sm text-black">Transit Cross-Reference</div>
                          <p className="text-xs text-black/60">
                            Jupiter transits (12 years), Saturn (30 years), Rahu (18 years) 
                            must ALL align with event dates for the calculated birth time.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[rgba(0,0,0,0.08)]">
                        <div className="w-6 h-6 rounded-full bg-[#000000] text-white flex items-center justify-center text-xs font-medium shrink-0">4</div>
                        <div>
                          <div className="font-medium text-sm text-black">Statistical Confidence</div>
                          <p className="text-xs text-black/60">
                            With 5 events, coincidence is possible. With 30+ events across 
                            different categories, statistical confidence reaches 99%+.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="p-4 bg-gradient-to-r from-[#000000]/10 to-[#000000]/10 border-t border-[#000000]/20">
              <p className="text-sm text-center text-black">
                <span className="font-medium">💡 Pro Tip:</span> Start with your most memorable life events 
                across different years. Add events gradually—each one improves accuracy!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
