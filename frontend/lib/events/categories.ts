/**
 * Complete Event Categories Data
 * 170+ Hindu/Sanatan Dharam life events with age and gender filters
 * Organized into separate major categories for better UX
 */

import { EventCategory } from './types';

export const EVENT_CATEGORIES: EventCategory[] = [
  // ==================== HINDU SANSKARS (16) ====================
  {
    id: 'sanskars',
    icon: '🕉️',
    label: 'Hindu Sanskars',
    color: '#FF9933',
    description: 'Traditional Hindu life cycle ceremonies from birth to renunciation',
    events: [
      { id: 'garbhadhan', label: 'Garbhadhan (Conception ceremony)', importance: 'high', ageRange: { min: 20, max: 50 } },
      { id: 'pumsavana', label: 'Pumsavana (Baby wish ritual)', importance: 'high', ageRange: { min: 20, max: 50 } },
      { id: 'simantonnayana', label: 'Simantonnayana (Baby shower)', importance: 'high', ageRange: { min: 20, max: 50 } },
      { id: 'jatakarma', label: 'Jatakarma (Birth ceremony)', importance: 'critical', ageRange: { min: 0, max: 0 } },
      { id: 'namkaran', label: 'Namkaran (Naming - 11th day)', importance: 'critical', ageRange: { min: 0, max: 0.1 } },
      { id: 'nishkramana', label: 'Nishkramana (First outdoor)', importance: 'medium', ageRange: { min: 0, max: 1 } },
      { id: 'annaprashan', label: 'Annaprashan (First solid food)', importance: 'critical', ageRange: { min: 0.5, max: 1 } },
      { id: 'chudakarana', label: 'Chudakarana/Mundan (First haircut)', importance: 'critical', ageRange: { min: 1, max: 3 } },
      { id: 'karnavedha', label: 'Karnavedha (Ear piercing)', importance: 'high', ageRange: { min: 1, max: 5 } },
      { id: 'upanayana', label: 'Upanayana (Sacred thread)', importance: 'critical', ageRange: { min: 7, max: 12 }, gender: 'male' },
      { id: 'vedarambha', label: 'Vedarambha (Study start)', importance: 'high', ageRange: { min: 7, max: 12 } },
      { id: 'samavartana', label: 'Samavartana (Graduation)', importance: 'critical', ageRange: { min: 16, max: 25 } },
      { id: 'vivaha', label: 'Vivaha (Marriage)', importance: 'critical', ageRange: { min: 20, max: 50 } },
      { id: 'grihasthashrama', label: 'Grihasthashrama (Householder)', importance: 'high', ageRange: { min: 20, max: 50 } },
      { id: 'vanaprastha', label: 'Vanaprastha (Forest dweller)', importance: 'high', ageRange: { min: 50, max: 100 } },
      { id: 'sanyasa', label: 'Sanyasa (Renunciation)', importance: 'critical', ageRange: { min: 50, max: 100 } },
    ],
  },

  // ==================== CHILDHOOD (0-12) ====================
  {
    id: 'childhood',
    icon: '👶',
    label: 'Childhood Milestones',
    color: '#FFB6C1',
    description: 'Early life developmental and milestone events',
    events: [
      { id: 'first_steps', label: 'First Steps', importance: 'medium', ageRange: { min: 0, max: 2 } },
      { id: 'first_words', label: 'First Words', importance: 'medium', ageRange: { min: 0, max: 2 } },
      { id: 'first_day_school', label: 'First Day of School', importance: 'high', ageRange: { min: 3, max: 6 } },
      { id: 'thread_ceremony', label: 'Janeu/Upanayana Ceremony', importance: 'critical', ageRange: { min: 7, max: 12 }, gender: 'male' },
      { id: 'first_fasting', label: 'First Fasting (Navratri/etc)', importance: 'medium', ageRange: { min: 5, max: 12 } },
      { id: 'first_puja', label: 'First Puja Performance', importance: 'medium', ageRange: { min: 5, max: 12 } },
      { id: 'childhood_illness', label: 'Major Childhood Illness', importance: 'high', ageRange: { min: 0, max: 12 } },
      { id: 'childhood_accident', label: 'Childhood Accident/Injury', importance: 'high', ageRange: { min: 0, max: 12 } },
      { id: 'sibling_birth', label: 'Sibling Born', importance: 'medium', ageRange: { min: 0, max: 12 } },
      { id: 'school_change', label: 'School Changed', importance: 'medium', ageRange: { min: 0, max: 12 } },
      { id: 'first_prize', label: 'First Prize/Achievement', importance: 'medium', ageRange: { min: 0, max: 12 } },
      { id: 'first_competition', label: 'First Competition Win', importance: 'medium', ageRange: { min: 0, max: 12 } },
    ],
  },

  // ==================== ADOLESCENT (13-19) ====================
  {
    id: 'adolescent',
    icon: '🧑',
    label: 'Teen Years',
    color: '#87CEEB',
    description: 'Adolescence education, development, and milestone events',
    events: [
      { id: 'board_10th', label: '10th Board Exam Results', importance: 'critical', ageRange: { min: 15, max: 16 } },
      { id: 'board_12th', label: '12th Board Exam Results', importance: 'critical', ageRange: { min: 17, max: 18 } },
      { id: 'college_admission', label: 'College Admission', importance: 'critical', ageRange: { min: 17, max: 19 } },
      { id: 'menarche', label: 'First Period (Menarche)', importance: 'critical', ageRange: { min: 12, max: 15 }, gender: 'female' },
      { id: 'first_love', label: 'First Love/Relationship', importance: 'high', ageRange: { min: 15, max: 19 } },
      { id: 'first_kiss', label: 'First Kiss', importance: 'medium', ageRange: { min: 15, max: 19 } },
      { id: 'first_heartbreak', label: 'First Heartbreak', importance: 'medium', ageRange: { min: 15, max: 19 } },
      { id: 'first_shave', label: 'First Shave (Facial Hair)', importance: 'medium', ageRange: { min: 15, max: 18 }, gender: 'male' },
      { id: 'voice_change', label: 'Voice Change Complete', importance: 'low', ageRange: { min: 14, max: 16 }, gender: 'male' },
      { id: 'driving_license', label: 'Driving License First Obtained', importance: 'high', ageRange: { min: 18, max: 19 } },
      { id: 'first_income', label: 'First Income/Earning', importance: 'high', ageRange: { min: 16, max: 19 } },
      { id: 'first_phone', label: 'First Mobile Phone', importance: 'low', ageRange: { min: 15, max: 19 } },
      { id: 'boarding_school', label: 'Boarding School Joined', importance: 'high', ageRange: { min: 13, max: 17 } },
      { id: 'competitive_exam', label: 'Competitive Exam (JEE/NEET/UPSC)', importance: 'critical', ageRange: { min: 17, max: 19 } },
    ],
  },

  // ==================== CAREER & WORK ====================
  {
    id: 'career',
    icon: '💼',
    label: 'Career & Work',
    color: '#000000',
    description: 'Jobs, promotions, business, and professional achievements',
    events: [
      { id: 'first_job', label: 'First Job / Started Working', importance: 'critical', ageRange: { min: 20, max: 25 } },
      { id: 'government_job', label: 'Got Government Job', importance: 'critical', ageRange: { min: 20, max: 35 } },
      { id: 'job_promotion', label: 'Job Promotion', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'job_change', label: 'Changed Job / Company', importance: 'high', ageRange: { min: 25, max: 45 } },
      { id: 'business_started', label: 'Started Own Business', importance: 'critical', ageRange: { min: 25, max: 50 } },
      { id: 'business_partnership', label: 'Business Partnership', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'business_loss', label: 'Major Business Loss', importance: 'critical', ageRange: { min: 25, max: 50 } },
      { id: 'job_loss', label: 'Lost Job / Resignation', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'retirement', label: 'Retirement', importance: 'high', ageRange: { min: 50, max: 60 } },
      { id: 'work_abroad', label: 'Started Working Abroad', importance: 'high', ageRange: { min: 22, max: 45 } },
      { id: 'freelancing_start', label: 'Started Freelancing', importance: 'medium', ageRange: { min: 20, max: 40 } },
      { id: 'major_project', label: 'Major Project Completed', importance: 'high', ageRange: { min: 22, max: 50 } },
    ],
  },

  // ==================== EDUCATION ====================
  {
    id: 'education',
    icon: '🎓',
    label: 'Education',
    color: '#6B9AC4',
    description: 'Degrees, certifications, and academic achievements',
    events: [
      { id: 'graduation_complete', label: 'Graduation Completed', importance: 'critical', ageRange: { min: 20, max: 25 } },
      { id: 'post_graduation', label: 'Post-Graduation / Masters', importance: 'high', ageRange: { min: 22, max: 28 } },
      { id: 'phd_doctorate', label: 'PhD / Doctorate', importance: 'high', ageRange: { min: 25, max: 35 } },
      { id: 'study_abroad', label: 'Started Studying Abroad', importance: 'high', ageRange: { min: 20, max: 30 } },
      { id: 'professional_degree', label: 'Professional Degree (CA/CS/Doctor)', importance: 'critical', ageRange: { min: 22, max: 30 } },
      { id: 'diploma_course', label: 'Diploma Course Completed', importance: 'medium', ageRange: { min: 18, max: 30 } },
      { id: 'certification', label: 'Professional Certification', importance: 'medium', ageRange: { min: 20, max: 40 } },
      { id: 'course_completion', label: 'Vocational Course Completed', importance: 'medium', ageRange: { min: 18, max: 35 } },
    ],
  },

  // ==================== MARRIAGE & RELATIONSHIPS ====================
  {
    id: 'marriage',
    icon: '💍',
    label: 'Marriage & Relationships',
    color: '#E879F9',
    description: 'Marriage, engagement, divorce, and romantic relationships',
    events: [
      { id: 'marriage', label: 'Marriage Ceremony', importance: 'critical', ageRange: { min: 20, max: 35 } },
      { id: 'engagement', label: 'Engagement Ceremony', importance: 'critical', ageRange: { min: 20, max: 35 } },
      { id: 'first_meeting_spouse', label: 'First Meeting with Spouse', importance: 'high', ageRange: { min: 20, max: 35 } },
      { id: 'marriage_registration', label: 'Marriage Registration', importance: 'high', ageRange: { min: 20, max: 35 } },
      { id: 'suhaag_raat', label: 'Suhaag Raat (Wedding Night)', importance: 'high', ageRange: { min: 20, max: 35 } },
      { id: 'divorce', label: 'Divorce Finalized', importance: 'critical', ageRange: { min: 25, max: 50 } },
      { id: 'separation', label: 'Separation from Spouse', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'second_marriage', label: 'Second Marriage', importance: 'critical', ageRange: { min: 30, max: 50 } },
      { id: 'extra_marital', label: 'Extra-marital Relationship', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'affair_discovered', label: 'Spouse Affair Discovered', importance: 'critical', ageRange: { min: 25, max: 50 } },
      { id: 'live_in_start', label: 'Started Live-in Relationship', importance: 'high', ageRange: { min: 20, max: 35 } },
      { id: 'renewal_vows', label: 'Marriage Vow Renewal', importance: 'medium', ageRange: { min: 30, max: 60 } },
    ],
  },

  // ==================== CHILDREN & PARENTHOOD ====================
  {
    id: 'children',
    icon: '👶',
    label: 'Children & Parenthood',
    color: '#5CB57B',
    description: 'Birth of children, pregnancy, adoption, and family milestones',
    events: [
      { id: 'first_child_birth', label: 'First Child Born', importance: 'critical', ageRange: { min: 22, max: 40 } },
      { id: 'second_child_birth', label: 'Second Child Born', importance: 'critical', ageRange: { min: 24, max: 42 } },
      { id: 'third_child_birth', label: 'Third Child Born', importance: 'critical', ageRange: { min: 26, max: 45 } },
      { id: 'pregnancy', label: 'Pregnancy Confirmed', importance: 'high', ageRange: { min: 22, max: 40 }, gender: 'female' },
      { id: 'conception_date', label: 'Conception Date (if known)', importance: 'high', ageRange: { min: 22, max: 40 }, gender: 'female' },
      { id: 'miscarriage', label: 'Miscarriage / Pregnancy Loss', importance: 'critical', ageRange: { min: 22, max: 40 }, gender: 'female' },
      { id: 'abortion', label: 'Abortion', importance: 'critical', ageRange: { min: 20, max: 40 }, gender: 'female' },
      { id: 'adoption', label: 'Adopted a Child', importance: 'critical', ageRange: { min: 25, max: 50 } },
      { id: 'child_marriage', label: "Child's Marriage", importance: 'high', ageRange: { min: 35, max: 50 } },
      { id: 'surrogacy', label: 'Surrogacy Arrangement', importance: 'critical', ageRange: { min: 25, max: 45 }, gender: 'female' },
      { id: 'ivf_success', label: 'IVF Success (Pregnancy)', importance: 'critical', ageRange: { min: 25, max: 45 }, gender: 'female' },
    ],
  },

  // ==================== PROPERTY & FINANCIAL ====================
  {
    id: 'financial',
    icon: '💰',
    label: 'Property & Financial',
    color: '#10B981',
    description: 'Money, property, investments, loans, and financial events',
    events: [
      { id: 'property_bought', label: 'Bought Property/House', importance: 'critical', ageRange: { min: 25, max: 50 } },
      { id: 'property_sold', label: 'Sold Property/House', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'griha_pravesh', label: 'Griha Pravesh (House Warming)', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'bhoomi_pujan', label: 'Bhoomi Pujan (Land Breaking)', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'major_loan', label: 'Took Major Loan', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'loan_repaid', label: 'Major Loan Repaid', importance: 'high', ageRange: { min: 30, max: 55 } },
      { id: 'first_car', label: 'First Car/Vehicle', importance: 'medium', ageRange: { min: 25, max: 40 } },
      { id: 'major_investment', label: 'Major Investment Made', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'financial_loss', label: 'Major Financial Loss', importance: 'critical', ageRange: { min: 25, max: 50 } },
      { id: 'bankruptcy', label: 'Bankruptcy / Financial Crisis', importance: 'critical', ageRange: { min: 25, max: 50 } },
      { id: 'inheritance_received', label: 'Received Inheritance', importance: 'high', ageRange: { min: 25, max: 60 } },
      { id: 'stock_market_loss', label: 'Major Stock Market Loss', importance: 'high', ageRange: { min: 25, max: 50 } },
    ],
  },

  // ==================== TRAVEL & RELOCATION ====================
  {
    id: 'travel',
    icon: '✈️',
    label: 'Travel & Relocation',
    color: '#06B6D4',
    description: 'Moving, travel abroad, and major journeys',
    events: [
      { id: 'first_abroad', label: 'First Trip Abroad', importance: 'high', ageRange: { min: 20, max: 45 } },
      { id: 'moved_new_city', label: 'Moved to New City', importance: 'high', ageRange: { min: 20, max: 45 } },
      { id: 'moved_new_country', label: 'Moved to New Country', importance: 'critical', ageRange: { min: 20, max: 45 } },
      { id: 'visa_approved', label: 'Visa Approved', importance: 'high', ageRange: { min: 20, max: 45 } },
      { id: 'citizenship', label: 'Got Foreign Citizenship', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'returned_india', label: 'Returned to India from Abroad', importance: 'high', ageRange: { min: 25, max: 50 } },
      { id: 'long_journey', label: 'Very Long Journey', importance: 'medium', ageRange: { min: 20, max: 60 } },
    ],
  },

  // ==================== HEALTH & MEDICAL ====================
  {
    id: 'health',
    icon: '🏥',
    label: 'Health & Medical',
    color: '#EF4444',
    description: 'Illness, surgeries, accidents, and recovery',
    events: [
      { id: 'major_surgery', label: 'Major Surgery', importance: 'critical', ageRange: { min: 20, max: 100 } },
      { id: 'hospitalization', label: 'Hospitalization (Serious)', importance: 'high', ageRange: { min: 20, max: 100 } },
      { id: 'major_accident', label: 'Major Accident', importance: 'critical', ageRange: { min: 20, max: 100 } },
      { id: 'chronic_diagnosis', label: 'Chronic Disease Diagnosed', importance: 'high', ageRange: { min: 25, max: 100 } },
      { id: 'mental_health_crisis', label: 'Mental Health Crisis', importance: 'high', ageRange: { min: 20, max: 100 } },
      { id: 'full_recovery', label: 'Full Recovery from Illness', importance: 'high', ageRange: { min: 20, max: 100 } },
      { id: 'stroke', label: 'Stroke', importance: 'critical', ageRange: { min: 40, max: 100 } },
      { id: 'heart_attack', label: 'Heart Attack', importance: 'critical', ageRange: { min: 35, max: 100 } },
      { id: 'covid', label: 'COVID-19 Infection', importance: 'medium', ageRange: { min: 20, max: 100 } },
    ],
  },

  // ==================== WOMEN HEALTH ====================
  {
    id: 'women_health',
    icon: '🌙',
    label: 'Women Health',
    color: '#EC4899',
    description: 'Female-specific health events and milestones',
    isSensitive: true,
    events: [
      { id: 'hysterectomy', label: 'Hysterectomy Surgery', importance: 'critical', ageRange: { min: 35, max: 60 }, gender: 'female' },
      { id: 'mastectomy', label: 'Mastectomy (Breast Removal)', importance: 'critical', ageRange: { min: 30, max: 60 }, gender: 'female' },
      { id: 'pcos_diagnosis', label: 'PCOS/Endometriosis Diagnosed', importance: 'high', ageRange: { min: 20, max: 35 }, gender: 'female' },
      { id: 'fertility_treatment', label: 'IVF/Fertility Treatment', importance: 'high', ageRange: { min: 25, max: 45 }, gender: 'female' },
      { id: 'menopause', label: 'Menopause Complete', importance: 'high', ageRange: { min: 45, max: 55 }, gender: 'female' },
      { id: 'breast_cancer', label: 'Breast Cancer Diagnosis', importance: 'critical', ageRange: { min: 30, max: 70 }, gender: 'female' },
      { id: 'cervical_cancer', label: 'Cervical Cancer Diagnosis', importance: 'critical', ageRange: { min: 25, max: 65 }, gender: 'female' },
    ],
  },

  // ==================== SENIOR YEARS ====================
  {
    id: 'senior',
    icon: '👴',
    label: 'Senior Years',
    color: '#8B4513',
    description: 'Later life transitions and milestones',
    events: [
      { id: 'widowhood', label: 'Became Widow/Widower', importance: 'critical', ageRange: { min: 50, max: 100 } },
      { id: 'grandchild_birth', label: 'First Grandchild Born', importance: 'high', ageRange: { min: 50, max: 70 } },
      { id: 'chronic_illness', label: 'Chronic Illness Onset', importance: 'high', ageRange: { min: 50, max: 100 } },
      { id: 'diabetes_diagnosis', label: 'Diabetes Diagnosed', importance: 'high', ageRange: { min: 45, max: 100 } },
      { id: 'bp_heart_issues', label: 'BP/Heart Issues Started', importance: 'high', ageRange: { min: 45, max: 100 } },
      { id: 'hip_fracture', label: 'Hip/Fracture in Old Age', importance: 'critical', ageRange: { min: 60, max: 100 } },
      { id: 'memory_loss', label: 'Memory Loss/Dementia Start', importance: 'high', ageRange: { min: 65, max: 100 } },
      { id: 'old_age_home', label: 'Moved to Old Age Home', importance: 'high', ageRange: { min: 70, max: 100 } },
      { id: 'writing_will', label: 'Wrote/Made Will', importance: 'high', ageRange: { min: 60, max: 100 } },
      { id: 'property_distribution', label: 'Property Distribution', importance: 'high', ageRange: { min: 65, max: 100 } },
      { id: 'late_sanyas', label: 'Sanyas in Late Life', importance: 'critical', ageRange: { min: 60, max: 100 } },
      { id: 'shraadh_first', label: 'First Shraadh after Parent Death', importance: 'high', ageRange: { min: 50, max: 100 } },
    ],
  },

  // ==================== SPIRITUAL & RELIGIOUS ====================
  {
    id: 'spiritual',
    icon: '🕉️',
    label: 'Spiritual & Religious',
    color: '#9932CC',
    description: 'Spiritual practices, pilgrimages, and divine experiences',
    events: [
      { id: 'guru_diksha', label: 'Received Guru Diksha', importance: 'critical', ageRange: 'all' },
      { id: 'spiritual_awakening', label: 'Spiritual Awakening', importance: 'high', ageRange: 'all' },
      { id: 'kundalini_awakening', label: 'Kundalini Awakening', importance: 'critical', ageRange: 'all' },
      { id: 'meditation_start', label: 'Started Serious Meditation', importance: 'medium', ageRange: 'all' },
      { id: 'mantra_siddhi', label: 'Mantra Siddhi Achieved', importance: 'high', ageRange: 'all' },
      { id: 'kumbh_mela', label: 'Kumbh Mela Attended', importance: 'high', ageRange: 'all' },
      { id: 'char_dham', label: 'Char Dham Yatra', importance: 'high', ageRange: 'all' },
      { id: 'varanasi_visit', label: 'First Varanasi Visit', importance: 'high', ageRange: 'all' },
      { id: 'tirupati_darshan', label: 'Tirupati Balaji Darshan', importance: 'high', ageRange: 'all' },
      { id: 'vaishno_devi', label: 'Vaishno Devi Yatra', importance: 'high', ageRange: 'all' },
      { id: 'amarnath_yatra', label: 'Amarnath Yatra', importance: 'high', ageRange: 'all' },
      { id: 'kedarnath_badrinath', label: 'Kedarnath-Badrinath', importance: 'high', ageRange: 'all' },
      { id: 'puri_jagannath', label: 'Puri Jagannath', importance: 'high', ageRange: 'all' },
      { id: 'rameshwaram', label: 'Rameshwaram', importance: 'high', ageRange: 'all' },
      { id: 'dwarka', label: 'Dwarka', importance: 'high', ageRange: 'all' },
      { id: 'satyanarayan_katha', label: 'Satyanarayan Katha', importance: 'medium', ageRange: 'all' },
      { id: 'navratri_fast', label: 'First Navratri Fast Complete', importance: 'medium', ageRange: 'all' },
      { id: 'karva_chauth', label: 'First Karva Chauth', importance: 'medium', ageRange: { min: 20, max: 60 }, gender: 'female' },
      { id: 'kaal_sarpa_shanti', label: 'Kaal Sarpa Shanti', importance: 'high', ageRange: 'all' },
      { id: 'mangal_dosha_shanti', label: 'Mangal Dosha Shanti', importance: 'high', ageRange: 'all' },
      { id: 'divine_vision', label: 'Divine Vision/Darshan', importance: 'critical', ageRange: 'all' },
      { id: 'prophetic_dream', label: 'Prophetic Dream', importance: 'high', ageRange: 'all' },
      { id: 'miracle_experience', label: 'Miracle Experienced', importance: 'high', ageRange: 'all' },
    ],
  },

  // ==================== TRAUMA & CRITICAL EVENTS ====================
  {
    id: 'trauma',
    icon: '⚡',
    label: 'Trauma & Critical',
    color: '#DC143C',
    description: 'Life-threatening and traumatic experiences',
    isSensitive: true,
    events: [
      { id: 'nde_accident', label: 'Near-Fatal Accident', importance: 'critical', ageRange: 'all' },
      { id: 'nde_coma', label: 'Coma / ICU Admission', importance: 'critical', ageRange: 'all' },
      { id: 'nde_drowning', label: 'Near Drowning', importance: 'critical', ageRange: 'all' },
      { id: 'nde_electrocution', label: 'Electrocution Survival', importance: 'critical', ageRange: 'all' },
      { id: 'nde_snake_bite', label: 'Snake Bite Survival', importance: 'critical', ageRange: 'all' },
      { id: 'nde_fall', label: 'Fall from Height Survival', importance: 'critical', ageRange: 'all' },
      { id: 'nde_fire', label: 'Fire/Burn Survival', importance: 'critical', ageRange: 'all' },
      { id: 'physical_assault', label: 'Physical Assault', importance: 'critical', ageRange: 'all' },
      { id: 'robbery_attack', label: 'Robbery / Burglary Attack', importance: 'high', ageRange: 'all' },
      { id: 'weapon_attack', label: 'Weapon Attack / Stabbing', importance: 'critical', ageRange: 'all' },
      { id: 'earthquake_survival', label: 'Earthquake Survival', importance: 'critical', ageRange: 'all' },
      { id: 'flood_survival', label: 'Flood Survival', importance: 'critical', ageRange: 'all' },
      { id: 'war_exposure', label: 'War / Combat Exposure', importance: 'critical', ageRange: 'all' },
      { id: 'terror_attack', label: 'Terrorist Attack Survival', importance: 'critical', ageRange: 'all' },
      { id: 'witnessed_death', label: 'Witnessed Violent Death', importance: 'critical', ageRange: 'all' },
      { id: 'suicide_attempt', label: 'Suicide Attempt', importance: 'critical', ageRange: 'all' },
    ],
  },

  // ==================== FAMILY EVENTS ====================
  {
    id: 'family',
    icon: '👨‍👩‍👧',
    label: 'Family Events',
    color: '#FF6347',
    description: 'Deaths, separations, and family structure changes',
    events: [
      { id: 'father_death', label: 'Father Death', importance: 'critical', ageRange: 'all' },
      { id: 'mother_death', label: 'Mother Death', importance: 'critical', ageRange: 'all' },
      { id: 'grandfather_death', label: 'Grandfather Death', importance: 'high', ageRange: 'all' },
      { id: 'grandmother_death', label: 'Grandmother Death', importance: 'high', ageRange: 'all' },
      { id: 'elder_sibling_death', label: 'Elder Sibling Death', importance: 'critical', ageRange: 'all' },
      { id: 'younger_sibling_death', label: 'Younger Sibling Death', importance: 'critical', ageRange: 'all' },
      { id: 'sibling_marriage', label: 'Sibling Marriage', importance: 'medium', ageRange: 'all' },
      { id: 'parents_divorce', label: 'Parents Divorce', importance: 'high', ageRange: { min: 0, max: 25 } },
      { id: 'parent_remarriage', label: 'Parent Remarriage', importance: 'high', ageRange: { min: 0, max: 25 } },
      { id: 'adopted_discovered', label: 'Discovered Being Adopted', importance: 'critical', ageRange: 'all' },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // ASTROLOGICAL RECTIFICATION MARKERS — BTR-Grade Events
  // These events have precise astrological signatures and provide the
  // strongest birth time rectification signals
  // ═════════════════════════════════════════════════════════════════════════════
  {
    id: 'btr_markers',
    icon: '⭐',
    label: 'Rectification Markers (BTR)',
    color: '#FFD700',
    description: 'High-precision events that provide the strongest birth time rectification signals. These have clear planetary signatures.',
    events: [
      { id: 'dasha_change', label: 'Dasha Period Changed (Mahadasha)', importance: 'critical', ageRange: 'all' },
      { id: 'jupiter_return', label: 'Jupiter Return (Age ~12, 24, 36, 48)', importance: 'critical', ageRange: 'all' },
      { id: 'saturn_return', label: 'Saturn Return (Age ~30, 60)', importance: 'critical', ageRange: { min: 27, max: 62 } },
      { id: 'sade_sati_start', label: 'Sade Sati Started (7.5 yr Saturn transit)', importance: 'critical', ageRange: 'all' },
      { id: 'sade_sati_peak', label: 'Sade Sati Peak (Saturn exact Moon)', importance: 'critical', ageRange: 'all' },
      { id: 'sade_sati_end', label: 'Sade Sati Ended', importance: 'high', ageRange: 'all' },
      { id: 'first_foreign_travel', label: 'First Foreign Travel / Abroad', importance: 'critical', ageRange: { min: 15, max: 60 } },
      { id: 'near_death', label: 'Near-Death Experience', importance: 'critical', ageRange: 'all' },
      { id: 'spiritual_awakening', label: 'Spiritual Awakening / Kundalini', importance: 'critical', ageRange: { min: 18, max: 60 } },
      { id: 'sudden_wealth', label: 'Sudden Wealth / Windfall', importance: 'critical', ageRange: { min: 18, max: 60 } },
      { id: 'sudden_opportunity', label: 'Sudden Life-Changing Opportunity', importance: 'high', ageRange: { min: 18, max: 60 } },
      { id: 'name_change', label: 'Name Change (Legal/Spiritual)', importance: 'critical', ageRange: 'all' },
      { id: 'legal_victory', label: 'Major Legal Victory', importance: 'high', ageRange: { min: 18, max: 60 } },
      { id: 'legal_defeat', label: 'Major Legal Defeat/Loss', importance: 'critical', ageRange: { min: 18, max: 60 } },
    ],
  },
];

export default EVENT_CATEGORIES;
