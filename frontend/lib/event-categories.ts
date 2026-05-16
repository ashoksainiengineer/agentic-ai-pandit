// lib/event-categories.ts
// Smart event categories to help users remember life events easily
// Users just see category → see common events → click to add

export interface EventTemplate {
    id: string;
    label: string;
    description?: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface EventCategory {
    id: string;
    icon: string;
    label: string;
    color: string;
    description: string;
    events: EventTemplate[];
}

export const EVENT_CATEGORIES: EventCategory[] = [
    {
        id: 'marriage',
        icon: '💍',
        label: 'Marriage & Relationships',
        color: '#E879F9', // Pink/Purple
        description: 'Marriage, engagement, divorce, romantic relationships',
        events: [
            { id: 'first_meeting_spouse', label: 'First meeting with spouse/partner', importance: 'high' },
            { id: 'engagement', label: 'Engagement ceremony', importance: 'critical' },
            { id: 'wedding', label: 'Wedding / Marriage ceremony', importance: 'critical' },
            { id: 'marriage_registration', label: 'Marriage registration (legal)', importance: 'high' },
            { id: 'separation', label: 'Separation from spouse', importance: 'high' },
            { id: 'divorce', label: 'Divorce finalized', importance: 'critical' },
            { id: 'second_marriage', label: 'Second marriage', importance: 'critical' },
            { id: 'serious_relationship', label: 'Started serious relationship', importance: 'medium' },
            { id: 'breakup', label: 'Major breakup', importance: 'medium' },
        ],
    },
    {
        id: 'career',
        icon: '💼',
        label: 'Career & Work',
        color: '#000000', // Gold
        description: 'Jobs, promotions, business, professional achievements',
        events: [
            { id: 'first_job', label: 'First job / Started working', importance: 'critical' },
            { id: 'job_change', label: 'Changed job / Company switch', importance: 'high' },
            { id: 'promotion', label: 'Got promoted', importance: 'high' },
            { id: 'business_start', label: 'Started own business', importance: 'critical' },
            { id: 'business_partner', label: 'Business partnership began', importance: 'high' },
            { id: 'job_loss', label: 'Lost job / Resignation', importance: 'high' },
            { id: 'major_project', label: 'Major project or achievement', importance: 'medium' },
            { id: 'work_abroad', label: 'Started working abroad', importance: 'high' },
            { id: 'retirement', label: 'Retirement', importance: 'high' },
            { id: 'government_job', label: 'Got government job', importance: 'high' },
        ],
    },
    {
        id: 'education',
        icon: '🎓',
        label: 'Education',
        color: '#6B9AC4', // Blue
        description: 'School, college, exams, degrees, certifications',
        events: [
            { id: 'school_start', label: 'Started school', importance: 'medium' },
            { id: 'board_10th', label: '10th Board Exam results', importance: 'high' },
            { id: 'board_12th', label: '12th Board Exam results', importance: 'high' },
            { id: 'college_admission', label: 'College admission', importance: 'high' },
            { id: 'graduation', label: 'Graduation completed', importance: 'critical' },
            { id: 'post_graduation', label: 'Post-graduation / Masters', importance: 'high' },
            { id: 'phd', label: 'PhD / Doctorate', importance: 'high' },
            { id: 'study_abroad', label: 'Started studying abroad', importance: 'high' },
            { id: 'competitive_exam', label: 'Competitive exam (JEE/NEET/UPSC etc)', importance: 'high' },
            { id: 'professional_cert', label: 'Professional certification', importance: 'medium' },
        ],
    },
    {
        id: 'children',
        icon: '👶',
        label: 'Children & Family',
        color: '#5CB57B', // Green
        description: 'Birth of children, pregnancy, adoption, family milestones',
        events: [
            { id: 'pregnancy', label: 'Found out about pregnancy', importance: 'high' },
            { id: 'child_birth_1', label: 'First child born', importance: 'critical' },
            { id: 'child_birth_2', label: 'Second child born', importance: 'critical' },
            { id: 'child_birth_3', label: 'Third child born', importance: 'critical' },
            { id: 'adoption', label: 'Adopted a child', importance: 'critical' },
            { id: 'miscarriage', label: 'Miscarriage / Pregnancy loss', importance: 'high' },
            { id: 'child_marriage', label: "Child's marriage", importance: 'high' },
            { id: 'grandchild', label: 'Grandchild born', importance: 'high' },
        ],
    },
    {
        id: 'health',
        icon: '🏥',
        label: 'Health & Medical',
        color: '#EF4444', // Red
        description: 'Illness, surgeries, accidents, recovery, medical events',
        events: [
            { id: 'major_illness', label: 'Major illness diagnosed', importance: 'critical' },
            { id: 'surgery', label: 'Surgery / Operation', importance: 'critical' },
            { id: 'hospitalization', label: 'Hospitalization (serious)', importance: 'high' },
            { id: 'accident', label: 'Accident / Injury', importance: 'critical' },
            { id: 'recovery', label: 'Full recovery from illness', importance: 'high' },
            { id: 'covid', label: 'COVID-19 infection', importance: 'medium' },
            { id: 'mental_health', label: 'Mental health crisis', importance: 'high' },
            { id: 'chronic_diagnosis', label: 'Chronic disease diagnosed', importance: 'high' },
        ],
    },
    {
        id: 'family_events',
        icon: '👨‍👩‍👧',
        label: 'Family Events',
        color: '#F97316', // Orange
        description: 'Parents, siblings, deaths, family changes',
        events: [
            { id: 'father_death', label: "Father's death", importance: 'critical' },
            { id: 'mother_death', label: "Mother's death", importance: 'critical' },
            { id: 'sibling_birth', label: 'Sibling born', importance: 'medium' },
            { id: 'sibling_marriage', label: "Sibling's marriage", importance: 'medium' },
            { id: 'grandparent_death', label: "Grandparent's death", importance: 'high' },
            { id: 'parents_divorce', label: "Parents' divorce", importance: 'high' },
            { id: 'family_reunion', label: 'Major family reunion', importance: 'low' },
            { id: 'inheritance', label: 'Received inheritance', importance: 'high' },
        ],
    },
    {
        id: 'financial',
        icon: '💰',
        label: 'Financial & Property',
        color: '#10B981', // Emerald
        description: 'Money, property, investments, loans, gains/losses',
        events: [
            { id: 'property_buy', label: 'Bought property/house', importance: 'critical' },
            { id: 'property_sell', label: 'Sold property/house', importance: 'high' },
            { id: 'major_loan', label: 'Took major loan', importance: 'high' },
            { id: 'loan_repaid', label: 'Major loan repaid', importance: 'high' },
            { id: 'car_buy', label: 'Bought first car / vehicle', importance: 'medium' },
            { id: 'big_investment', label: 'Major investment made', importance: 'high' },
            { id: 'financial_loss', label: 'Major financial loss', importance: 'critical' },
            { id: 'lottery_win', label: 'Lottery / Unexpected gain', importance: 'high' },
            { id: 'bankruptcy', label: 'Bankruptcy / Financial crisis', importance: 'critical' },
        ],
    },
    {
        id: 'travel',
        icon: '✈️',
        label: 'Travel & Relocation',
        color: '#06B6D4', // Cyan
        description: 'Moving, travel abroad, pilgrimages, major journeys',
        events: [
            { id: 'first_abroad', label: 'First trip abroad', importance: 'high' },
            { id: 'city_move', label: 'Moved to new city', importance: 'high' },
            { id: 'country_move', label: 'Moved to new country', importance: 'critical' },
            { id: 'home_change', label: 'Changed home / residence', importance: 'medium' },
            { id: 'pilgrimage', label: 'Major pilgrimage (Char Dham, Hajj, etc)', importance: 'high' },
            { id: 'long_journey', label: 'Very long journey', importance: 'medium' },
            { id: 'visa_approved', label: 'Visa approved for abroad', importance: 'high' },
        ],
    },
    {
        id: 'spiritual',
        icon: '🕉️',
        label: 'Spiritual & Religious',
        color: '#8B5CF6', // Purple
        description: 'Spiritual awakening, religious events, guru diksha',
        events: [
            { id: 'spiritual_awakening', label: 'Spiritual awakening', importance: 'high' },
            { id: 'guru_diksha', label: 'Received Guru Diksha', importance: 'critical' },
            { id: 'meditation_start', label: 'Started serious meditation practice', importance: 'medium' },
            { id: 'pilgrimage_major', label: 'Major pilgrimage', importance: 'high' },
            { id: 'religious_ceremony', label: 'Important religious ceremony', importance: 'medium' },
            { id: 'upanayana', label: 'Upanayana / Thread Ceremony', importance: 'high' },
            { id: 'sanyas', label: 'Took Sanyas / Renunciation', importance: 'critical' },
        ],
    },
    {
        id: 'legal',
        icon: '⚖️',
        label: 'Legal & Government',
        color: '#64748B', // Slate
        description: 'Court cases, legal matters, government documents',
        events: [
            { id: 'court_case', label: 'Court case started', importance: 'high' },
            { id: 'court_verdict', label: 'Court verdict received', importance: 'critical' },
            { id: 'passport', label: 'Got first passport', importance: 'medium' },
            { id: 'legal_dispute', label: 'Major legal dispute', importance: 'high' },
            { id: 'property_dispute', label: 'Property dispute', importance: 'high' },
            { id: 'police_case', label: 'Police case / FIR', importance: 'high' },
        ],
    },
];

// Helper to get category by ID
export function getCategoryById(id: string): EventCategory | undefined {
    return EVENT_CATEGORIES.find(cat => cat.id === id);
}

// Helper to get all events flat list
export function getAllEventTemplates(): Array<EventTemplate & { categoryId: string }> {
    return EVENT_CATEGORIES.flatMap(cat =>
        cat.events.map(event => ({ ...event, categoryId: cat.id }))
    );
}

// Helper for form submission - convert template to LifeEvent format
export function templateToLifeEvent(
    template: EventTemplate,
    categoryId: string,
    eventDate: string,
    description?: string
) {
    const category = getCategoryById(categoryId);
    return {
        id: `${template.id}_${Date.now()}`,
        category: categoryId,
        eventType: template.label,
        datePrecision: 'exact',
        eventDate,
        description: description || template.label,
        importance: template.importance,
        icon: category?.icon || '📌',
        color: category?.color || '#000000',
    };
}

export default EVENT_CATEGORIES;
