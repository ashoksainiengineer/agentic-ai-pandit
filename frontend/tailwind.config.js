/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ═══════════════════════════════════════════════════════════════
      // AI PANDIT DESIGN SYSTEM — LIGHT THEME PALETTE
      // Clean monochrome with subtle spectrum accents
      // Single font: DM Sans (weights 300, 400, 500 only)
      // ═══════════════════════════════════════════════════════════════
      colors: {
        // Surface — backgrounds, cards, containers
        surface: {
          base: '#f8f8f8',      // page bg (app canvas)
          raised: '#ffffff',    // card/tile bg
          elevated: '#efefef',  // accent bg, hover states
          muted: 'rgba(0,0,0,0.08)', // subtle borders, dividers
        },

        // BTR Rich Palette — Premium warm-coral design language
        btr: {
          accent: '#C65D3B',
          'accent-deep': '#A4452D',
          'accent-soft': 'rgba(198, 93, 59, 0.08)',
          'accent-glow': 'rgba(198, 93, 59, 0.15)',
          success: '#184131',
          'success-soft': 'rgba(24, 65, 49, 0.08)',
          'bg-warm': '#FAF8F5',
          'surface-warm': '#FFFCF9',
          'surface-cream': '#F5F2EC',
          'border-soft': 'rgba(0, 0, 0, 0.06)',
          'border-warm': 'rgba(0, 0, 0, 0.04)',
          dark: '#1A1A1E',
          'dark-soft': '#2C2C30',
          'text-primary': '#1A1A1E',
          'text-secondary': '#6B6560',
          'text-muted': '#8A837D',
        },

        // Primary — black CTAs, active states
        primary: {
          DEFAULT: '#000000',   // black
          light: '#333333',     // hover/light
          dark: '#000000',      // pressed/dark
          dim: '#636363',       // muted
        },

        // Trust — dark green, encryption/verified badges
        trust: {
          DEFAULT: '#184131',   // dark emerald
          light: '#3D9A73',     // success green
        },

        // Content — text colors
        content: {
          primary: '#000000',   // main text
          secondary: '#636363', // muted text
          disabled: '#959595',  // placeholder
        },

        // Destructive — errors, warnings, caution
        destructive: {
          DEFAULT: '#636363',   // gray (app style)
        },

        // Monochrome scale (replaces gold scale)
        gold: {
          50: '#f8f8f8', 100: '#efefef', 200: '#d9d9d9',
          300: '#b3b3b3', 400: '#8c8c8c', 500: '#636363',
          600: '#4d4d4d', 700: '#333333', 800: '#1a1a1a',
          900: '#000000',
        },

        // ═══════════════════════════════════════════════════════════════
        // PRISM DESIGN SYSTEM — "Prism on white stationery"
        // ═══════════════════════════════════════════════════════════════
        prism: {
          // Neutrals
          ink: '#000000',
          snow: '#ffffff',
          canvas: '#f8f8f8',
          fog: '#efefef',
          pebble: '#d9d9d9',
          graphite: '#636363',
          slate: '#959595',
          steel: '#aeaeae',
          ash: '#7c7c7c',
          // Spectrum
          'rose-quartz': '#c679c4',
          crimson: '#fa3d1d',
          marigold: '#ffb005',
          lavender: '#e1e1fe',
          'signal-blue': '#0358f7',
          'hot-pink': '#fd02f5',
        },

        // ═══════════════════════════════════════════════════════════════
        // Clean minimal light theme
        // ═══════════════════════════════════════════════════════════════
        app: {
          bg: '#F8F8F8',
          'bg-warm': '#FAFAFA',
          ink: '#000000',
          'ink-muted': 'rgba(0,0,0,0.6)',
          'ink-subtle': 'rgba(0,0,0,0.4)',
          'ink-faint': 'rgba(0,0,0,0.15)',
          border: 'rgba(0,0,0,0.08)',
          'border-strong': 'rgba(0,0,0,0.12)',
          card: '#FFFFFF',
          'hero-blue-start': '#a8c4e8',
          'hero-blue-end': '#c8ddf5',
          'hero-blue-mid': '#b8d3ee',
        },
      },

      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        prism: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        'app-heading': ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        'app-serif': ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        'app-mono': ['var(--font-mono)', 'monospace'],
      },

      borderRadius: {
        'prism-sm': '0.625rem',    // 10px — images
        'prism-md': '1rem',        // 16px — nav items, pills
        'prism-lg': '1.25rem',     // 20px — cards, containers
        'prism-xl': '1.875rem',    // 30px — cards, filled buttons
        'prism-2xl': '2.5rem',     // 40px — large containers
        'app-sm': '12px',
        'app-md': '16px',
        'app-lg': '20px',
        'app-xl': '24px',
        'app-2xl': '32px',
      },

      boxShadow: {
        'prism-sm': '0 0 8px 0 rgba(0, 0, 0, 0.08)',
        'prism-none': 'none',
        'app-sm': '0 2px 8px rgba(0,0,0,0.04)',
        'app-md': '0 4px 24px rgba(0,0,0,0.06)',
        'app-lg': '0 8px 40px rgba(0,0,0,0.08)',
        'app-float': '0 12px 48px rgba(0,0,0,0.10)',
      },

      spacing: {
        'prism-1': '0.3125rem',   // 5px
        'prism-2': '0.375rem',    // 6px
        'prism-3': '0.625rem',    // 10px
        'prism-4': '0.875rem',    // 14px
        'prism-5': '0.9375rem',   // 15px
        'prism-6': '1.25rem',     // 20px
        'prism-7': '1.5rem',      // 24px
        'prism-8': '2rem',        // 32px
        'prism-9': '2.125rem',    // 34px
        'prism-10': '3rem',       // 48px
        'prism-11': '4rem',       // 64px
        'prism-12': '5rem',       // 80px
        'prism-13': '6rem',       // 96px
        'prism-14': '7.5rem',     // 120px
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'prism-fade-in-up': 'prismFadeInUp 0.5s ease-out forwards',
        'prism-fade-in': 'prismFadeIn 0.4s ease-out forwards',
        'prism-scale-in': 'prismScaleIn 0.4s ease-out forwards',
        'prism-gentle-float': 'prismGentleFloat 4s ease-in-out infinite',
        'prism-gradient-sweep': 'prismGradientSweep 3s ease infinite',
        'prism-shimmer': 'prismShimmer 2s ease-in-out infinite',
        'app-float': 'appFloat 6s ease-in-out infinite',
        'app-float-slow': 'appFloatSlow 8s ease-in-out infinite',
        'app-float-delayed': 'appFloat 6s ease-in-out infinite 2s',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        prismFadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        prismFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        prismScaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        prismGentleFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        prismGradientSweep: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        prismShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        appFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-16px) rotate(1deg)' },
        },
        appFloatSlow: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(-1deg)' },
        },
      },

      // ═══════════════════════════════════════════════════════════════
      // DESIGN SYSTEM EXTENSIONS
      // ═══════════════════════════════════════════════════════════════

      backdropBlur: {
        'app-xs': '4px',
        'app-sm': '8px',
        'app-md': '16px',
        'app-lg': '24px',
        'app-xl': '40px',
        'app-2xl': '60px',
        'app-3xl': '80px',
      },

      transitionTimingFunction: {
        'app-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'app-out-slow': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'app-in-out': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },

      fontSize: {
        'app-caption': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        'app-body': ['1.125rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        'app-body-lg': ['1.375rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        'app-subheading': ['1.125rem', { lineHeight: '1.33', letterSpacing: '0em' }],
        'app-heading-sm': ['1.375rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        'app-heading': ['3.125rem', { lineHeight: '1.18', letterSpacing: '-0.04em' }],
        'app-heading-lg': ['3.375rem', { lineHeight: '1.17', letterSpacing: '-0.04em' }],
        'app-display': ['4.5rem', { lineHeight: '1.11', letterSpacing: '-0.04em' }],
        'app-display-lg': ['7.2rem', { lineHeight: '1.05', letterSpacing: '-0.05em' }],
      },

      letterSpacing: {
        'app-tight': '-0.04em',
        'app-tighter': '-0.05em',
        'app-normal': '-0.02em',
        'app-wide': '0.02em',
        'app-wider': '0.05em',
      },

      opacity: {
        'app-3': '0.03',
        'app-5': '0.05',
        'app-8': '0.08',
        'app-10': '0.10',
        'app-15': '0.15',
        'app-40': '0.40',
        'app-60': '0.60',
        'app-70': '0.70',
        'app-85': '0.85',
      },

      backgroundImage: {
        'app-mesh': 'raappl-gradient(at 40% 20%, rgba(168, 196, 232, 0.6) 0px, transparent 50%), raappl-gradient(at 80% 0%, rgba(200, 221, 245, 0.5) 0px, transparent 50%), raappl-gradient(at 0% 50%, rgba(184, 211, 238, 0.5) 0px, transparent 50%), raappl-gradient(at 80% 50%, rgba(168, 196, 232, 0.4) 0px, transparent 50%), raappl-gradient(at 0% 100%, rgba(200, 221, 245, 0.5) 0px, transparent 50%)',
        'app-glow': 'raappl-gradient(circle at 50% 50%, rgba(168, 196, 232, 0.4) 0%, transparent 70%)',
        'app-glow-strong': 'raappl-gradient(circle at 50% 50%, rgba(168, 196, 232, 0.6) 0%, transparent 60%)',
        'app-spectrum': 'linear-gradient(90deg, #c679c4 0%, #fa3d1d 25%, #ffb005 50%, #e1e1fe 75%, #0358f7 100%)',
      },

      scale: {
        'app-98': '0.98',
        'app-99': '0.99',
        'app-101': '1.01',
        'app-102': '1.02',
      },

      rotate: {
        'app-1': '1deg',
        'app-neg1': '-1deg',
        'app-2': '2deg',
        'app-neg2': '-2deg',
      },

      zIndex: {
        'app-header': '50',
        'app-overlay': '40',
        'app-modal': '30',
        'app-tooltip': '20',
        'app-content': '10',
        'app-bg': '-10',
      },

      saturate: {
        'app-150': '1.5',
        'app-180': '1.8',
      },

      brightness: {
        'app-105': '1.05',
        'app-110': '1.10',
      },

      maxWidth: {
        'app-container': '1200px',
        'app-narrow': '900px',
        'app-wide': '1400px',
      },

      gap: {
        'app-1': '0.3125rem',
        'app-2': '0.375rem',
        'app-3': '0.625rem',
        'app-4': '0.875rem',
        'app-5': '0.9375rem',
        'app-6': '1.25rem',
        'app-7': '1.5rem',
        'app-8': '2rem',
        'app-9': '2.125rem',
        'app-10': '3rem',
      },

      translate: {
        'app-1': '0.25rem',
        'app-2': '0.5rem',
        'app-4': '1rem',
        'app-8': '2rem',
        'app-16': '4rem',
      },

      ringWidth: {
        'app': '1px',
        'app-2': '2px',
        'app-3': '3px',
      },

      ringColor: {
        'app-blue': 'rgba(168, 196, 232, 0.5)',
        'app-ink': 'rgba(0, 0, 0, 0.08)',
      },

      ringOffsetWidth: {
        'app': '2px',
      },

      width: {
        'app-container': '1200px',
      },

      height: {
        'app-header': '3.25rem',
        'app-section-sm': '80px',
        'app-section': '120px',
      },

      minHeight: {
        'app-screen': '100dvh',
      },

      padding: {
        'app-1': '0.3125rem',
        'app-2': '0.375rem',
        'app-3': '0.625rem',
        'app-4': '0.875rem',
        'app-5': '0.9375rem',
        'app-6': '1.25rem',
        'app-7': '1.5rem',
        'app-8': '2rem',
        'app-9': '2.125rem',
        'app-10': '3rem',
        'app-11': '4rem',
        'app-12': '5rem',
        'app-13': '6rem',
        'app-14': '7.5rem',
      },

      margin: {
        'app-1': '0.3125rem',
        'app-2': '0.375rem',
        'app-3': '0.625rem',
        'app-4': '0.875rem',
        'app-5': '0.9375rem',
        'app-6': '1.25rem',
        'app-7': '1.5rem',
        'app-8': '2rem',
        'app-9': '2.125rem',
        'app-10': '3rem',
        'app-11': '4rem',
        'app-12': '5rem',
        'app-13': '6rem',
        'app-14': '7.5rem',
      },
    },
  },
  plugins: [],
};
