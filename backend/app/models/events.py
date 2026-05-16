from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field


class Gender(StrEnum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class EventCategory(StrEnum):
    EDUCATION = "education"
    CAREER = "career"
    MARRIAGE = "marriage"
    CHILDREN = "children"
    FAMILY = "family"
    HEALTH = "health"
    FINANCIAL = "financial"
    FINANCE = "finance"
    TRAVEL = "travel"
    SPIRITUAL = "spiritual"
    LEGAL = "legal"
    PUBLIC_LIFE = "public_life"
    KARMIC_EVENTS = "karmic_events"
    IDENTITY_SHIFTS = "identity_shifts"
    PROMOTION = "promotion"
    BUSINESS = "business"
    PROPERTY = "property"
    RELOCATION = "relocation"
    ACCIDENT = "accident"
    DEATH_RELATIVE = "death_relative"
    DIVORCE = "divorce"
    SURGERY = "surgery"
    INHERITANCE = "inheritance"
    AWARDS = "awards"
    SANSKARS = "sanskars"
    CHILDHOOD = "childhood"
    ADOLESCENT = "adolescent"
    TEEN = "teen"
    BTR_MARKERS = "btr_markers"
    OTHER = "other"


class DatePrecision(StrEnum):
    EXACT_DATE_TIME = "exact_date_time"
    EXACT_DATE = "exact_date"
    DATE_RANGE = "date_range"
    MONTH_YEAR = "month_year"
    MONTH_RANGE = "month_range"
    YEAR_RANGE = "year_range"


class EventImportance(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SessionStatus(StrEnum):
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"
    CANCELLED = "cancelled"


class OffsetPreset(StrEnum):
    SECONDS_6 = "seconds-6"
    SECONDS_30 = "seconds-30"
    MINUTES_30 = "30min"
    HOUR_1 = "1hour"
    HOURS_2 = "2hours"
    HOURS_4 = "4hours"
    HOURS_6 = "6hours"
    HOURS_12 = "12hours"
    CUSTOM = "custom"


EVENT_TYPES: dict[EventCategory, list[str]] = {
    EventCategory.EDUCATION: [
        "School admission",
        "College admission",
        "Graduation",
        "Higher studies",
    ],
    EventCategory.CAREER: ["Job start", "Job change", "Promotion", "Business start"],
    EventCategory.MARRIAGE: ["Engagement", "Wedding", "Divorce"],
    EventCategory.CHILDREN: ["Pregnancy", "Birth", "Adoption"],
    EventCategory.FAMILY: ["Parent death", "Sibling birth", "Family event"],
    EventCategory.HEALTH: ["Major illness", "Surgery", "Recovery", "Accident"],
    EventCategory.FINANCIAL: ["Money gain", "Property purchase", "Business deal"],
    EventCategory.FINANCE: ["Money gain", "Property purchase", "Business deal"],
    EventCategory.TRAVEL: ["Long journey", "Relocation", "International travel"],
    EventCategory.SPIRITUAL: [
        "Spiritual awakening",
        "Meditation retreat",
        "Religious event",
    ],
    EventCategory.LEGAL: ["Court case started", "Legal win", "Court verdict"],
    EventCategory.PUBLIC_LIFE: ["Award", "Fame spike", "Public recognition"],
    EventCategory.KARMIC_EVENTS: ["Sudden windfall", "Natural disaster", "Pet loss"],
    EventCategory.IDENTITY_SHIFTS: [
        "Weight transform",
        "Nickname change",
        "Appearance shift",
    ],
    EventCategory.PROMOTION: ["Promotion", "Role expansion", "Recognition"],
    EventCategory.BUSINESS: ["Business launch", "Partnership", "Major deal"],
    EventCategory.PROPERTY: ["Property purchase", "House move", "Land acquisition"],
    EventCategory.RELOCATION: ["City move", "Country move", "Permanent relocation"],
    EventCategory.ACCIDENT: ["Accident", "Emergency injury", "Near-miss"],
    EventCategory.DEATH_RELATIVE: [
        "Parent death",
        "Relative death",
        "Family bereavement",
    ],
    EventCategory.DIVORCE: ["Separation", "Divorce filing", "Divorce finalization"],
    EventCategory.SURGERY: ["Surgery", "Procedure", "Hospital admission"],
    EventCategory.INHERITANCE: [
        "Inheritance received",
        "Estate settlement",
        "Will dispute",
    ],
    EventCategory.AWARDS: ["Award", "Prize", "Public recognition"],
    EventCategory.SANSKARS: ["Mundan", "Upanayan", "Namkaran", "Annaprashan"],
    EventCategory.CHILDHOOD: [
        "First steps",
        "First words",
        "School start",
        "Milestone event",
    ],
    EventCategory.ADOLESCENT: ["Coming of age", "Identity shift", "Peer milestone"],
    EventCategory.TEEN: ["Teen achievement", "Teen struggle", "Coming of age"],
    EventCategory.BTR_MARKERS: ["Birth time verification", "Rectification marker"],
    EventCategory.OTHER: ["Custom event"],
}


class BirthData(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")  # YYYY-MM-DD
    tentative_time: str = Field(
        pattern=r"^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$"
    )  # HH:MM:SS
    birth_place: str = Field(..., max_length=200)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timezone: float = Field(..., ge=-12, le=14)
    gender: Gender | None = None


class LifeEvent(BaseModel):
    id: str | None = None
    category: EventCategory
    event_type: str = Field(..., min_length=1, max_length=100)
    date_precision: DatePrecision
    event_date: str
    end_date: str | None = None
    event_time: str | None = None
    description: str | None = Field(default=None, max_length=2000)
    importance: EventImportance = EventImportance.MEDIUM
    icon: str | None = None
    age_at_event: float | None = None
    impact: str | None = None


class TimeOffsetConfig(BaseModel):
    preset: OffsetPreset
    custom_minutes: int | None = Field(default=None, ge=1, le=720)
    description: str


class CandidateTime(BaseModel):
    time: str
    offset_minutes: int
    offset_description: str
    candidate_date: str | None = None
    day_offset: int | None = None
    candidate_key: str | None = None
    rank: int | None = None
    batch_index: int | None = None
    priority: int | None = None
