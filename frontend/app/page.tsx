/**
 * AI Pandit — Landing Page
 * AI Pandit Landing Page — Premium Redesign
 * sleek, minimal aesthetic with black pill CTAs
 * 3 sections: Hero (with logos), How It Works, Privacy
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  Lock as LockIcon,
  BarChart3,
  Timer,
  Activity,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LivePipelineDemo from '@/components/landing/LivePipelineDemo';

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS — Easing curves
   ═══════════════════════════════════════════════════════════════════════════════ */


const fadeIn = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: 'easeOut' },
};



const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};


/* ═══════════════════════════════════════════════════════════════════════════════
   DATA — Existing content arrays, retained data
   ═══════════════════════════════════════════════════════════════════════════════ */

const HERO_STATS = [
  { value: 'Seconds', label: 'Precision', icon: Timer },
  { value: '6', label: 'Stage Pipeline', icon: BarChart3 },
  { value: 'NASA JPL', label: 'Ephemeris Data', icon: Activity },
];

const FEATURES_LIST = [
  {
    number: '01',
    title: 'Birth Data Ingestion',
    description: 'Your date, approximate time, and birthplace feed into the engine. Even rough estimates (±2 hours) work — the AI narrows down from there using NASA JPL DE440 ephemeris data accurate to ±0.0001°.',
    active: true,
  },
  {
    number: '02',
    title: 'Rashi Grid Synthesis',
    description: 'Thousands of candidate birth times are generated within your uncertainty window. Each candidate gets a full planetary chart — Sun, Moon, Ascendant, and all nine grahas positioned to arc-second precision.',
    active: false,
  },
  {
    number: '03',
    title: 'Dasha-Verified Elimination',
    description: 'Vimshottari Dasha periods (120-year life cycle) are calculated for every candidate. Times that don\'t align with your provided life events — marriage, career, relocation — are eliminated. Only event-matching candidates survive.',
    active: false,
  },
  {
    number: '04',
    title: 'KP Sub-Lord Precision',
    description: 'Krishnamurti Paddhati sub-lord analysis divides each sign into 249 subdivisions. Only candidates where planetary sub-periods match event timing advance. This eliminates 60-80% of remaining candidates.',
    active: false,
  },
  {
    number: '05',
    title: 'Shadbala & Divisional Validation',
    description: 'Six-fold planetary strength (Shadbala) is computed. D9 Navamsha, D10 Dashamsha, and D60 Shashtiamsha divisional charts validate survivors. Weak planetary placements and incorrect house lords are rejected by the AI.',
    active: false,
  },
  {
    number: '06',
    title: 'Prana-Dasha Convergence',
    description: 'Final 48-second precision window. The AI synthesizes all five methods — Dasha, Transit, KP, Shadbala, and Nadi — into a consensus verdict. The optimal birth time emerges with a confidence score and supporting evidence.',
    active: false,
  },
];

const PRIVACY_FEATURES = [
  { label: 'AES-256-GCM Encryption', active: true },
  { label: 'Client-Side Encryption', active: true },
  { label: 'Per-User Unique Keys', active: true },
  { label: 'Zero-Access Architecture', active: true },
  { label: 'Auto-Expiring Sessions', active: true },
];



/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT — Hero Section
   ═══════════════════════════════════════════════════════════════════════════════ */

function Hero() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  const [wordIndex, setWordIndex] = useState(0);
  const animatedWords = ['precision', 'depth', 'certainty'];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % animatedWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [animatedWords.length]);

  return (
    <section className="app-hero-gradient relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[5%] w-[500px] h-[500px] rounded-full bg-[#79C9FF]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#a8c4e8]/20 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[5%] w-[300px] h-[300px] rounded-full bg-[#b8d3ee]/25 blur-[80px] pointer-events-none" />


      {/* Hero Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-20"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-black/5 rounded-full text-xs font-medium text-black/60 uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-black/20" />
            Vedic Birth Time Rectification
          </span>
        </motion.div>

        {/* Main Heading — weight 300, tracking -0.04em, line-height 1.11 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[4.5rem] font-light text-black leading-[1.11] tracking-[-0.04em] mb-6"
        >
          <span className="font-light">Your </span>
          <span className="font-medium">birth time</span>
          <span className="font-light">, with divine </span>
          <span className="relative inline-block font-medium">
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
                className="absolute left-0 whitespace-nowrap"
              >
                {animatedWords[wordIndex]}
              </motion.span>
            </AnimatePresence>
            {/* Invisible placeholder to reserve space */}
            <span className="invisible">{animatedWords[0]}</span>
          </span>
        </motion.h1>

        {/* Subheading — 18px, text-black/50, max-w-2xl, centered */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg md:text-xl text-black/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          AI-powered birth time rectification within seconds-level precision.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary CTA — black pill button */}
          <Link
            href="/rectify"
            className="app-btn group inline-flex items-center gap-3"
          >
            Start Your Analysis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Secondary link — ChevronDown */}
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-8 py-4 text-black/60 hover:text-black transition-colors text-sm font-medium"
          >
            See how it works
            <ChevronDown className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Stats Bar — 3 stats with icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
        >
          {HERO_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-black/30" />
                <div className="text-left">
                  <div className="text-lg font-medium text-black">{stat.value}</div>
                  <div className="text-sm text-black/40">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Powered by — compact logo strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-12"
        >
          <p className="text-center text-[10px] font-medium text-black/25 uppercase tracking-widest mb-4">Powered by
</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            {TECH_LOGOS.map((tech) => (
              <div key={tech.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/50 transition-colors group">
                {tech.icon ? (
                  <Image
                    src={`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${tech.icon}.svg`}
                    alt={tech.name}
                    width={20}
                    height={20}
                    className="tech-logo h-5 w-auto flex-shrink-0 transition-all duration-300 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100"
                    unoptimized
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-black/10 bg-black/20" />
                )}
                <span className="text-[11px] text-black/35 group-hover:text-black/60 transition-colors">
                  {tech.name}
                </span>
              </div>
            ))}
          </div>
      </motion.div>
      </motion.div>

      {/* Scroll Indicator — bouncing dot in rounded-full border container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-black/20 rounded-full flex justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 bg-black/30 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT — How It Works Section (id="how-it-works")
   Vertical stack: full-width 6-stage accordion (top) + 3-panel horizontal row (bottom)
   ═══════════════════════════════════════════════════════════════════════════════ */

function HowItWorks() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section id="how-it-works" className="py-32 relative bg-[var(--prism-canvas)]">
      <div className="app-container">
        {/* Section Header */}
        <motion.div {...fadeIn} className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full text-xs font-medium text-black/60 uppercase tracking-wider mb-6">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-black leading-[1.1] tracking-[-0.04em]">
            Six stages to your true birth time
          </h2>
        </motion.div>

        {/* Part 1 — Full-width 6-stage accordion */}
        <div className="max-w-3xl mx-auto mb-16">
          {FEATURES_LIST.map((feature, index) => (
            <motion.div
              key={feature.number}
              {...staggerItem}
              transition={{ ...staggerItem.transition, delay: index * 0.1 }}
              data-number={feature.number}
              onClick={() => setActiveFeature(index)}
              className={`relative pl-8 py-5 pr-6 rounded-r-2xl cursor-pointer group transition-all duration-300 border-l ${
                activeFeature === index
                  ? 'border-black/20 bg-white shadow-sm'
                  : 'border-black/[0.06] hover:border-black/15'
              }`}
            >
              {/* Number positioned over the thin left border */}
              <span className={`absolute left-0 top-5 -translate-x-1/2 w-5 text-center text-xs font-mono transition-colors duration-300 ${
                activeFeature === index ? 'text-black' : 'text-black/30'
              }`}>
                {feature.number}
              </span>
              <div>
                {/* Title — active=black, inactive=black/50 */}
                <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                  activeFeature === index ? 'text-black' : 'text-black/50'
                }`}>
                  {feature.title}
                </h3>
                {/* Description — animated expand on click */}
                <AnimatePresence>
                  {activeFeature === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-black/50 text-sm leading-relaxed pt-1">
                        {feature.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Part 2 — 3-panel horizontal row: AI Reasoning | Ephemeris | Candidate Times */}
        <motion.div {...fadeIn}>
          <LivePipelineDemo />
        </motion.div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT — Tech Stack Section
   Categorized grid with brand-color dots, Dia aesthetic
   ═══════════════════════════════════════════════════════════════════════════════ */

const TECH_LOGOS = [
  { name: 'Google Cloud Run', icon: 'googlecloud' },
  { name: 'Vercel', icon: 'vercel' },
  { name: 'Neon DB', icon: null },
  { name: 'Clerk Auth', icon: null },
  { name: 'Upstash', icon: null },
  { name: 'Redis', icon: 'redis' },
  { name: 'Python', icon: 'python' },
  { name: 'TypeScript', icon: 'typescript' },
  { name: 'Tailwind CSS', icon: 'tailwindcss' },
];


/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT — Privacy Section
   Dashed border box, lock icon, toggle pills, privacy description
   ═══════════════════════════════════════════════════════════════════════════════ */

function Privacy() {
  return (
    <section className="py-32 bg-[var(--prism-canvas)]">
      <div className="max-w-[800px] mx-auto px-6">
        <motion.div {...fadeIn} className="text-center">
          {/* Dashed border box */}
          <div className="relative inline-block p-12 rounded-3xl border-2 border-dashed border-black/10">
            {/* Lock icon — scale-in animation */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-black/5 flex items-center justify-center"
            >
              <LockIcon className="w-8 h-8 text-black/40" />
            </motion.div>

            {/* Heading — 50px font-light */}
            <h2 className="text-4xl md:text-5xl font-light text-black leading-[1.1] tracking-[-0.04em] mb-4">
              Privacy first
            </h2>
            {/* Subheading — 30px weight 300 text-black/30 */}
            <p className="text-2xl md:text-3xl font-light text-black/30 mb-8">
              with you in control
            </p>

            {/* Toggle Pills — clean black active / gray inactive */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {PRIVACY_FEATURES.map((feature) => (
                <div
                  key={feature.label}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    feature.active
                      ? 'bg-black text-white'
                      : 'bg-black/5 text-black/40'
                  }`}
                >
                  {/* Dot indicator — clean on/off */}
                  <span className={`w-2 h-2 rounded-full ${
                    feature.active ? 'bg-white/60' : 'bg-black/15'
                  }`} />
                  {feature.label}
                </div>
              ))}
            </div>

            {/* Description — text-black/40, max-w-md */}
            <p className="text-black/40 max-w-lg mx-auto mb-8 leading-relaxed text-sm">
              Your birth data is <span className="text-black/60 font-medium">encrypted with AES-256-GCM</span> before it leaves your browser.
              Each user gets a <span className="text-black/60 font-medium">unique encryption key</span> derived via scrypt KDF — even we cannot decrypt your data.
              AI prompts are <span className="text-black/60 font-medium">fully anonymized</span>: only planetary positions and Dasha periods are sent to the model. No names, dates, or locations ever leave our secure pipeline.
            </p>

            {/* Learn more link — subtle text link */}
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black/5 hover:bg-black/10 rounded-full text-sm font-medium text-black/60 transition-all duration-300"
            >
              Learn more about privacy
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE — Assembles all 5 sections in order
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--prism-canvas)]">
      <Navbar transparent />
      <Hero />
      <HowItWorks />
      <Privacy />
      <Footer />
    </main>
  );
}
