
// types.ts

// This file defines the TypeScript interfaces for the advanced astrological signals
// that are streamed from the backend.

// ============================================================================
// Main Interface: IAdvancedSignals
// This is the top-level object that will be part of the SSE stream.
// ============================================================================

export interface IAdvancedSignals {
  vargottamaPlanets?: IPlanetaryStrength[];
  pushkaraPlanets?: IPlanetaryStrength[];
  parivartanaYogas?: IParivartanaYoga[];
  ashtakavargaScores?: IAshtakavargaScores;
  yoginiDasha?: IYoginiDashaPeriods;
}

// ============================================================================
// Sub-Interfaces for Each Signal Type
// These provide detailed structures for each specific astrological calculation.
// ============================================================================

/**
 * Represents a planet with enhanced strength (Vargottama or Pushkara).
 * Includes the planet's name and the specific degree it occupies.
 */
export interface IPlanetaryStrength {
  planet: TPlanet;
  degree: number;
}

/**
 * Describes a Parivartana Yoga (exchange of signs) between two planets.
 * Includes the type of yoga (Maha, Dainya, etc.) for more detailed analysis.
 */
export interface IParivartanaYoga {
  planets: [TPlanet, TPlanet];
  signs: [TSign, TSign];
  yogaType: TParivartanaType;
}

/**
 * Contains the Ashtakavarga scores for all planets and the Ascendant.
 * The `scores` object maps each planet to an array of 12 numbers,
 * representing the benefic points in each of the 12 houses.
 */
export interface IAshtakavargaScores {
  [planet: string]: number[]; // Using a mapped type for flexibility
}

/**
 * Defines the Yogini Dasha periods relevant to the analysis.
 * `eventDasha` is the dasha active during the user-provided key life event.
 * `currentDasha` is the dasha active at the time of the analysis.
 */
export interface IYoginiDashaPeriods {
  eventDasha: IYoginiDasha;
  currentDasha: IYoginiDasha;
}

/**
 * Represents a single Yogini Dasha period, including its name,
 * the ruling planet, and its start and end dates.
 */
export interface IYoginiDasha {
  dashaName: TYoginiDashaName;
  rulingPlanet: TPlanet;
  startDate: string; // ISO 8601 date string
  endDate: string;   // ISO 8601 date string
}


// ============================================================================
// Type Aliases & Enums for Vedic Astrology Terms
// These ensure consistency and prevent typos for common astrological terms.
// ============================================================================

export type TPlanet = | 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu' | 'Ascendant';

export type TSign = | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type TParivartanaType = 'Maha Yoga' | 'Dainya Yoga' | 'Kahala Yoga';

export type TYoginiDashaName = | 'Mangala' | 'Pingala' | 'Dhanya' | 'Bhramari' | 'Bhadrika' | 'Ulka' | 'Siddha' | 'Sankata';

