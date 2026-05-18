# Agentic AI-Pandit: End-to-End System Walkthrough

> **⚠️ PROPRIETARY SOFTWARE — ALL RIGHTS RESERVED**
> See [LICENSE](LICENSE) for full terms.

---

## System Architecture (MVP — Sufficient Stack)

```
User  →  Vercel (Next.js Frontend)
              ↓ HTTPS / SSE
      Google Cloud Run (FastAPI Backend)
              ↓
   ┌──────────┬──────────┬──────────┬──────────┐
   │          │          │          │          │
 Neon DB   Upstash   Vertex AI  Existing
(Postgres)  Redis   (Gemini)   Skyfield
 Check-   Cache +    LLM        Ephemeris
 points   Queue    Agents       Service
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 (Vercel) | SaaS dashboard, rectification UI, SSE progress stream |
| **Backend API** | FastAPI (Cloud Run) | REST endpoints, session management, job orchestration |
| **Agent Pipeline** | LangGraph + PostgresSaver | 5-node BTR filter graph with checkpoint recovery |
| **LLM Layer** | Vertex AI (Gemini) | Tiered: `flash-8b` (cheap), `flash` (mid), `pro` (premium) |
| **Database** | Neon PostgreSQL | Sessions, jobs, events, LangGraph checkpoints |
| **Cache / Queue** | Upstash Redis | Tool result cache, rate limiting, job queue, SSE pub/sub |
| **Auth** | Clerk | JWT verification |
| **Ephemeris** | Existing Skyfield Service | JPL DE440 planetary positions (already deployed) |

**Explicitly NOT in MVP:** GCS archival, Cloud Tasks, Secret Manager, Sentry, Prometheus, Cloud Run Jobs, CI/CD pipelines. Added only when scale demands.

---

## Concrete Example

**User submits:**
- **Date:** 16 June 1999
- **Time Window:** 09:30 AM - 11:30 AM (2 hours)
- **Location:** Delhi, India
- **30 Life Events:** Including —
  - 2012: Major road accident (ICU, 2 months bed rest)
  - 2018: Got a tech job at Google (software engineer)
  - 2021: Marriage
  - 2023: First child born (normal delivery)
  - ... 26 more minor events

**Goal:** Find exact birth time to the second.

---

## STEP 0: Input Processing

### What Happens
Orchestrator receives 30 events. It does NOT process all 30 at once. It sorts them by "severity score" and picks the **top 3 Anchor Events**.

### Anchor Event Selection Logic
```
Severity = f(medical_impact, life_stage_change, verifiability)

2012 Accident  → Severity: 95/100 [LIFE-THREATENING, ICU, long recovery]
2021 Marriage  → Severity: 80/100 [Major life transition, fixed date]
2018 Tech Job  → Severity: 65/100 [Career milestone, specific profession]
2023 Childbirth → Severity: 70/100 [Major event, date is verifiable]
```

Top 3 anchors: **Accident, Marriage, Tech Job**.

### Why Only 3?
Kyunki 30 events × 120 time candidates × full planetary snapshot = **token bomb**. Orchestrator "anchor-first" strategy use karta hai. Pehle 3 se macro filter karo, baki 27 se micro tune karo.

---

## STEP 1: Get All Lagnas in the Window

### Tool Call
```json
{
  "tool": "find_lagna_boundaries",
  "args": {
    "date": "1999-06-16",
    "start": "09:30",
    "end": "11:30",
    "location": {"lat": 28.6139, "lon": 77.2090},
    "ayanamsa": "lahiri"
  }
}
```

### Tool Returns (from Skyfield/Swiss Ephemeris)
```json
{
  "lagna_segments": [
    {"start": "09:30:00", "end": "10:14:22", "lagna": "Cancer", "degree": "7°15' to 29°59'"},
    {"start": "10:14:23", "end": "11:30:00", "lagna": "Leo", "degree": "0°00' to 18°42'"}
  ]
}
```

### HURDLE #1: Ayanamsa Discrepancy
Lahiri vs Raman vs KP ayanamsa — lagna changes at **different exact seconds**.
- Lahiri: 10:14:22
- Raman: 10:15:07  
- KP Old: 10:14:51

**Solution:** Orchestrator ko config mein `ayanamsa=lahiri` hard-set rakhna hoga. User-facing documentation mein clearly likhna hoga: "We use Lahiri Ayanamsa. If you prefer Raman, contact support."

---

## STEP 2: Lagna Elimination — "Does the Ascendant Match the Person?"

### What the Orchestrator Thinks

> *"User ko 2012 mein major accident hua. Vedic astrology mein accident ke liye 6th house (disease/injury), 8th house (sudden events), aur 12th house (hospitalization) dekhte hain. Mars aur Saturn ka connection bhi zaroori hai. Mujhe dono lagnas ke liye accident ka planetary signature check karna hai."*

### Tool Call (Parallel — Both Lagnas)
```json
{
  "tool": "get_holistic_snapshot",
  "args": {
    "date": "1999-06-16",
    "time": "09:45:00",  // mid-point of Cancer window
    "location": {"lat": 28.6139, "lon": 77.2090}
  }
}
```

### Tool Returns (Cancer Lagna)
```json
{
  "lagna": {"sign": "Cancer", "degree": 14.2, "nakshatra": "Pushya", "pada": 2},
  "planets": {
    "Mars":    {"sign": "Scorpio", "house": 5, "degree": 11.3, "retrograde": false},
    "Saturn":  {"sign": "Pisces", "house": 9, "degree": 23.1, "retrograde": false},
    "Rahu":    {"sign": "Leo", "house": 2, "degree": 5.7},
    "Ketu":    {"sign": "Aquarius", "house": 8, "degree": 5.7},
    "Jupiter": {"sign": "Aries", "house": 10, "degree": 8.9, "retrograde": false},
    "Sun":     {"sign": "Taurus", "house": 11, "degree": 20.4},
    "Moon":    {"sign": "Cancer", "house": 1, "degree": 14.2},
    "Mercury": {"sign": "Gemini", "house": 12, "degree": 6.1, "retrograde": false},
    "Venus":   {"sign": "Taurus", "house": 11, "degree": 18.8}
  },
  "houses": {
    "6": {"sign": "Sagittarius", "degree": 12.0},
    "8": {"sign": "Aquarius", "degree": 22.3},
    "12": {"sign": "Gemini", "degree": 5.8}
  }
}
```

### The LLM's Reasoning (Dasha Expert Agent)

> *"Cancer Lagna ke liye: 6th house Sagittarius hai, Jupiter ruled. 8th house Aquarius, Saturn ruled + Ketu placed there. Ketu in 8th = sudden, unexplainable events (accidents fit perfectly). 12th house Gemini with Mercury — hospitalization indicator. Mars in 5th (Scorpio) = aggressive energy, but not directly aspecting 6/8/12. However, Mars is 5th lord AND 10th lord (career, surgery).* 
>
> *VERDICT: Accident **is** explainable with Cancer Lagna. Score: 85/100."*

Now check Leo Lagna (same time, just lagna changed):

Tool returns different houses for Leo Lagna:
```json
{
  "lagna": {"sign": "Leo", "degree": 14.2},
  "houses": {
    "6": {"sign": "Capricorn", "degree": 12.0},
    "8": {"sign": "Pisces", "degree": 22.3},
    "12": {"sign": "Cancer", "degree": 5.8}
  }
}
```

> *"Leo Lagna ke liye: 6th house Capricorn (Saturn), 8th house Pisces (Jupiter), 12th house Cancer (Moon). 8th house mein Jupiter ek protector hai — iska matlab 8th house events (accidents) aksar 'saved by grace' hote hain. User ICU mein tha, barely survived nahi — he was critically injured. Jupiter in 8th for Leo doesn't match the severity.*
>
> *VERDICT: Accident has weak support in Leo Lagna. Score: 40/100."*

### HURDLE #2: Token Cost per LLM Call

Every `get_holistic_snapshot` call returns ~2KB JSON. Each LLM analysis costs:
- Input: ~1000 tokens (snapshot + instruction) = ~$0.002 (Groq) to ~$0.015 (Claude)
- Output: ~300 tokens (reasoning) = ~$0.001 to ~$0.005

For 2 lagnas × 3 time points × 3 anchor events = 18 LLM calls = ~$0.05 to $0.35 just for Lagna stage.

**Full pipeline estimate (all 6 stages): ~$0.50 to $3.00 per BTR session.**

### Decision After Lagna Stage
```
Cancer Lagna: Score 85 → KEEP (move to Dasha stage)
Leo Lagna: Score 40 → ELIMINATE (score < 40 threshold)

Remaining window: 09:30 - 10:14 AM (Cancer Lagna only)
Window size: 44 minutes (down from 120 minutes)
```

---

## STEP 3: Dasha Alignment — "Do Life Events Match the Planetary Periods?"

### What the Orchestrator Thinks

> *"Cancer window mein multiple time points hain. 2018 mein tech job lagi — yeh Mercury ya Saturn dasha mein possible hai. 2021 shaadi — Venus ya Jupiter dasha. Mujhe har 5-minute interval ke liye Vimshottari dasha check karni hai aur dekhna hai ki 2012, 2018, 2021 ke events actual dasha periods se match karte hain ya nahi."*

### Tool Call
```json
{
  "tool": "get_vimshottari_dasha_sequence",
  "args": {
    "birth_date": "1999-06-16",
    "birth_time": "09:45:00",
    "location": {"lat": 28.6139, "lon": 77.2090}
  }
}
```

### Tool Returns
```json
{
  "moon_nakshatra": "Pushya",
  "moon_pada": 2,
  "starting_dasha": "Saturn",
  "dasha_sequence": [
    {"maha": "Saturn", "start": "1999-06-16", "end": "2018-06-16"},
    {"maha": "Mercury", "start": "2018-06-16", "end": "2035-06-16"}
  ],
  "antardasha_for_2018": {
    "maha": "Mercury", "antar": "Mercury",
    "start": "2018-06-16", "end": "2019-01-14"
  },
  "antardasha_for_2021": {
    "maha": "Mercury", "antar": "Venus",
    "start": "2020-12-18", "end": "2022-07-27"
  },
  "antardasha_for_2012": {
    "maha": "Saturn", "antar": "Mars",
    "start": "2012-03-15", "end": "2013-04-22"
  }
}
```

### The LLM's Reasoning

> *"2018 Tech Job: Mercury Mahadasha + Mercury Antardasha. Mercury = communication, technology, analytical skills. PERFECT MATCH. Score: 90.*
>
> *2021 Marriage: Mercury Mahadasha + Venus Antardasha. Venus = love, marriage, relationships. STRONG MATCH. Score: 85.*
>
> *2012 Accident: Saturn Mahadasha + Mars Antardasha. Saturn = chronic suffering, Mars = aggression, surgery, blood. CLASSIC ACCIDENT COMBO. Score: 95.*
>
> *OVERALL DASHA SCORE: 90/100.*

### HURDLE #3: Dasha Boundary Sensitivity

Agar birth time 09:45 ki jagah 09:44 hota, toh Moon ki degree change ho sakti hai, jisse starting dasha badal sakti hai. **1 minute ka difference = alag dasha sequence.**

Yeh BTR ka double-edged sword hai:
- **Good:** Precise time detection possible hai.
- **Bad:** Agar calculation engine mein 1 arc-second ki bhi error hai, toh dasha galat ho sakti hai.

**Solution:** Orchestrator ko dasha window ke edges pe extra cautious rehna hoga. Agar candidate time dasha boundary ke 5-minute andar hai, toh `confidence_penalty = 15` lagao.

### HURDLE #4: Multiple Correct Dashas?

Kya hoga agar dono 09:40 aur 09:50 dono mein sahi dasha combinations hain? Tab Orchestrator dono ko alive rakhega aur Varga stage mein differentiate karega. Yeh **beam search** strategy hai.

### After Dasha Stage
```
Cancer Lagna window: 09:30 - 10:14 AM
Dasha filter se bache candidates:
  - 09:40 AM: Score 88 (strong dasha match)
  - 09:45 AM: Score 92 (strongest dasha match)
  - 09:50 AM: Score 78 (weaker dasha match)
  
ELIMINATED: Everything before 09:40 and after 09:50
Remaining window: 09:40 - 09:50 AM (10 minutes)
```

---

## STEP 4: Varga Chart Alignment — "Do Divisional Charts Support the Events?"

### What the Orchestrator Thinks

> *"2018 Tech Job: D-10 (Dasamsa) chart mein 10th house strong hona chahiye. Tech job analytical hoti hai — Mercury ya Saturn influence expected hai. 2021 Marriage: D-9 (Navamsa) mein Venus/7th house strong. 2012 Accident: D-6 (Shashtamsa) ya D-30 (Trimsamsa) mein afflictions."*

### Tool Call
```json
{
  "tool": "get_varga_matrix",
  "args": {
    "date": "1999-06-16",
    "time": "09:45:00",
    "location": {"lat": 28.6139, "lon": 77.2090},
    "vargas": ["D9", "D10", "D60"]
  }
}
```

### Tool Returns (for 09:45)
```json
{
  "D9": {
    "ascendant": {"sign": "Pisces", "degree": 8.3},
    "planets": {
      "Venus": {"sign": "Taurus", "house": 3},
      "Mars": {"sign": "Cancer", "house": 5},
      "Saturn": {"sign": "Capricorn", "house": 11}
    }
  },
  "D10": {
    "ascendant": {"sign": "Virgo", "degree": 15.7},
    "planets": {
      "Mercury": {"sign": "Virgo", "house": 1},
      "Saturn": {"sign": "Aquarius", "house": 6},
      "Sun": {"sign": "Taurus", "house": 9}
    }
  }
}
```

### The LLM's Reasoning (Varga Expert Agent)

> *"D-10 (Career): Lagna = Virgo. Virgo = analytical, detail-oriented, technical. Mercury in 1st house (own sign) = strong analytical mind, software/tech. Saturn in 6th (Aquarius) = disciplined work ethic, service-oriented tech job. PERFECT for software engineer. Score: 90.*
>
> *D-9 (Marriage): Ascendant Pisces, Venus in Taurus (own sign), 3rd house. Venus strong but in 3rd (communication/courage) instead of 7th (partnership). 7th lord Mercury. Average marriage alignment. Score: 65."*

### HURDLE #5: Varga Chart Sensitivity

Varga charts change every **2-4 minutes** depending on the planetary degree. D-60 (Shashtyamsa) changes every **2 minutes**!

09:45 ke D-10 mein Lagna Virgo tha. 09:46 par Lagna Libra ho sakta hai.

### Tool Call for 09:46
```json
{
  "tool": "get_varga_changes",
  "args": {
    "varga": "D10",
    "start": "09:40",
    "end": "09:50"
  }
}
```

### Returns
```json
{
  "D10_lagna_changes": [
    {"time": "09:46:12", "from": "Virgo", "to": "Libra"}
  ]
}
```

### LLM's Reasoning

> *"09:46:12 ke baad D-10 Lagna Libra ho jata hai. Libra = art, balance, diplomacy. Tech job (analytical) ke liye Virgo better fit hai. Isliye birth time 09:46:12 se PEHLE hona chahiye. Reject everything after 09:46."*

### After Varga Stage
```
Remaining window: 09:40:00 - 09:46:12 (6 minutes 12 seconds)
```

---

## STEP 5: Forensic Precision — D-60 Deities and Prana Dasha

### What the Orchestrator Thinks

> *"Ab sirf 6 minute bache hain. D-60 (Shashtyamsa) deities aur Prana dasha se exact second nikalna hai. D-60 har 2 minute mein badalta hai, aur Prana dasha seconds-level precision deta hai."*

### Tool Call
```json
{
  "tool": "get_d60_deities_and_prana",
  "args": {
    "date": "1999-06-16",
    "start": "09:40:00",
    "end": "09:46:12",
    "interval": "30_seconds"
  }
}
```

### Returns (Sample — 3 time points)
```json
[
  {
    "time": "09:44:30",
    "D60_lagna": {"sign": "Sagittarius", "deity": "Maya", "nature": "Illusion/Duality"},
    "prana_dasha": "Moon-Mercury-Saturn-Mars-Ketu",
    "event_alignment": {"2018_job": 0.62, "2021_marriage": 0.55, "2012_accident": 0.48}
  },
  {
    "time": "09:45:00",
    "D60_lagna": {"sign": "Capricorn", "deity": "Amrita", "nature": "Nectar/Bliss/Healing"},
    "prana_dasha": "Moon-Mercury-Saturn-Mercury-Venus",
    "event_alignment": {"2018_job": 0.95, "2021_marriage": 0.88, "2012_accident": 0.73}
  },
  {
    "time": "09:45:30",
    "D60_lagna": {"sign": "Aquarius", "deity": "Yama", "nature": "Death/Restriction"},
    "prana_dasha": "Moon-Mercury-Saturn-Jupiter-Rahu",
    "event_alignment": {"2018_job": 0.71, "2021_marriage": 0.42, "2012_accident": 0.91}
  }
]
```

### The LLM's Reasoning (Forensic Expert Agent)

> *"09:45:00 — D60 Lagna Capricorn, deity Amrita (Nectar/Bliss). This is the strongest candidate. 2018 job alignment = 0.95 (highest), 2021 marriage = 0.88 (highest), 2012 accident = 0.73 (adequate — Ketu in 8th explains it at birth level, not D60 level).*
>
> *09:45:30 — D60 deity Yama (Death). Too harsh. User survived accident and had a child — Yama D60 doesn't fit. Eliminate.*
>
> *09:44:30 — Maya (Illusion) deity with lower job alignment. Weaker.*
>
> *FINAL FORENSIC SCORE: 09:45:00 = 93/100.*"

---

## STEP 6: The Critic — Red-Team Verification

### What the Orchestrator Thinks

> *"09:45:00 mil gaya. But before I show this to user, mujhe ek Critic Agent se cross-verify karana hai. Critic deliberately flaws dhundega."*

### Critic Agent's Internal Process

The Critic agent gets:
1. The final time: 09:45:00 AM
2. All tool outputs for 09:45:00
3. All 30 life events (not just 3 anchors)

### Critic's Verification Checklist

> **Check 1: "Does any event CONTRADICT this time?"**
>
> *"User ke 30 events mein ek minor surgery 2020 mein hui (appendix removal) + 2023 mein child birth. 09:45 ke chart mein 2023 ki dasha mein Jupiter antardasha chal rahi thi — Jupiter 5th lord (children) hai. Child birth perfectly supported.*
>
> *2020 surgery: Saturn-Mercury dasha. Mercury 6th lord (disease). Appropriate."*
>
> **PASS ✅**

> **Check 2: "Is Rahu in 5th house?"**
>
> *"Agar Rahu 5th house mein hota, toh child birth mein complications expected hain. User ne bataya normal delivery thi. Rahu 09:45 ke chart mein 2nd house mein hai, 5th mein nahi. Sahi hai."*
>
> **PASS ✅**

> **Check 3: "Gandanta check"**
>
> *"Moon Pushya nakshatra mein hai, jo Cancer sign ke andar hai. Koi Gandanta (water-fire junction) nahi. Lagna bhi 14.2° Cancer mein stable hai — no sandhi issues."*
>
> **PASS ✅**

> **Check 4: "Prashna Kundli cross-verification"**
>
> *"User ne jab query submit ki (May 16, 2026, current moment), tab Prashna Lagna Aries thi. Prashna chart mein 5th house Sun hai — querent ka sawaal 'creation' (birth time discovery) se related hai, jo Prashna se match karta hai. Secondary confirmation."*
>
> **PASS ✅**

### HURDLE #6: Critic Hallucination

Critic agent might "imagine" a problem that doesn't exist. Example: Critic says "Saturn in 8th indicates chronic disease" but Saturn is actually in 9th house.

**Solution:** Critic agent ke paas bhi tools hone chahiye. Woh blind trust nahi karega Orchestrator ke output ka — woh dobara `get_holistic_snapshot(09:45)` call karega and verify karega. Double tool call = double token cost, but necessary for accuracy.

### HURDLE #7: Infinite Debate Loop

Kya hoga agar Critic flaw pakad leta hai aur Orchestrator dobara Dasha check karta hai, phir Critic naya flaw pakadta hai... infinite loop?

**Solution:** Hard-coded `max_iterations = 3`. Agar 3 cycles ke baad bhi disagreement hai, toh system "confidence: medium" ke saath best answer return karega, aur user ko "manual review recommended" flag dikhayega.

---

## STEP 7: Final Output to User

```json
{
  "rectified_time": "09:45:00 AM",
  "confidence": "94%",
  "window": "09:44:45 - 09:45:15 (±15 seconds)",
  "breakdown": {
    "lagna_alignment": 0.85,
    "dasha_alignment": 0.92,
    "varga_alignment": 0.90,
    "forensic_alignment": 0.93,
    "critic_verification": "PASSED"
  },
  "agent_log": [
    "[Orchestrator] Window: 09:30-11:30 → 2 Lagnas found (Cancer, Leo)",
    "[Dasha Expert] Leo rejected. Cancer: dasha matches 2012/2018/2021 events. Score: 92",
    "[Varga Expert] D-10 Lagna Virgo supports tech job. Reject >09:46:12. Window: 09:40-09:46",
    "[Forensic Expert] D-60 deity Amrita at 09:45:00. Prana dasha aligns all events. Score: 93",
    "[Critic Agent] Verified: Rahu not in 5th, Gandanta clear, 2023 child birth supported. PASS"
  ]
}
```

---

## COMPLETE HURDLE REGISTER

| # | Hurdle | Impact | Mitigation |
|---|---|---|---|
| 1 | **Ayanamsa Discrepancy** | Lagna change at wrong second → wrong chart | Hard-set Lahiri Ayanamsa. Future: user-selectable. |
| 2 | **Token Cost** | $0.50-$3.00 per BTR session | Anchor event strategy (3 events, not 30). Use Groq for cheap tier. |
| 3 | **Dasha Boundary Sensitivity** | 1 second = different dasha sequence | Confidence penalty near boundaries. Conservative pruning. |
| 4 | **Multiple Valid Candidates** | Dono 09:40 aur 09:50 sahi lag rahe hain | Beam search — keep top-3 candidates, not top-1. Differentiate in Varga. |
| 5 | **Varga Sensitivity** | D-60 changes every 2 min, D-10 every 3-4 min | Exact boundary detection via `find_boundary_changes` tool. |
| 6 | **Critic Hallucination** | Critic "imagines" flaws that don't exist | Critic has its own tool access. Verifies via fresh tool calls, not trust. |
| 7 | **Infinite Debate Loop** | Orchestrator ↔ Critic ping-pong forever | Hard max_iterations = 3. Fallback: "Manual review recommended." |
| 8 | **User Event Reliability** | User remembers accident year wrong | Fuzzy date matching. Events accept ±1 year tolerance. Scoring weights fuzzy matches lower. |
| 9 | **LLM Hallucination** | "Saturn in 6th" when tool says 5th | **All factual claims must cite tool output.** Prompt enforces: "NEVER state a planetary position not in the JSON." |
| 10 | **Context Window Overflow** | 30 events + multiple chart snapshots = >128K tokens | Summary compression between stages. Previous stage outputs compressed to bullet points. |
| 11 | **Tool Call Failure** | Skyfield API timeout, response malformed | Retry × 3 with exponential backoff. If persistent, fail gracefully: "Incomplete analysis. Try again." |
| 12 | **Cold Start (No Historical Data)** | Scoring weights not calibrated | Start with astrologer-defined default weights. Update weights via Reflexion after each session. |
| 13 | **Latency** | Sequential LLM calls = 30-60 seconds per session | Parallelize where possible. Lagna check for both Cancer & Leo = parallel. Cache repetitive tool calls. |
| 14 | **State Loss on Crash** | Orchestrator crashes midway, loses all progress | LangGraph checkpointing to Postgres/SQLite. Resume from last checkpoint. |

---

## TOKEN COST ESTIMATE (Per BTR Session)

All LLM inference runs on **Vertex AI (Gemini)**. Fallback to other providers only on outage.

| Stage | Tool Calls | LLM Calls | Est. Cost (Vertex AI Gemini) |
|---|---|---|---|
| 0. Input processing | 0 | 1 (anchor extraction, `flash-8b`) | ~$0.0005 |
| 1. Lagna filter | 1 (lagna boundaries) | 2 (both lagnas, `flash`) | ~$0.003 |
| 2. Dasha filter | 1 (dasha for 3 candidates) | 1 (analysis, `flash`) | ~$0.002 |
| 3. Varga filter | 2 (varga matrix + changes) | 1 (analysis, `flash`) | ~$0.004 |
| 4. Forensic | 1 (D60 scan) | 1 (analysis, `pro`) | ~$0.008 |
| 5. Critic | 2 (verification + cross-check) | 1 (critique, `pro`) | ~$0.01 |
| 6. Final output | 0 | 1 (summary generation, `flash`) | ~$0.001 |
| **TOTAL** | **7** | **8** | **~$0.03** |

~₹2.50 per BTR session. Scale to 10,000 sessions/month = ~$300 LLM spend.

**Fallback providers** (only on Vertex AI outage): Groq (Llama 3), Anthropic (Claude Haiku).

---

## WHAT MAKES THIS SYSTEM "AGENTIC" (NOT JUST ALGORITHMIC)

A classical system would do this:
```python
for time in range(9:30, 11:30, step=1_minute):
    score = check_lagna(time) + check_dasha(time, events) + check_varga(time)
    if score > best_score:
        best_time = time
```

Our agentic system does this:
```
Orchestrator reads events → "Thinks" about which to prioritize
→ Calls tools → "Reads" results → "Decides" to eliminate half the window
→ "Decides" to call Dasha expert → "Reads" Dasha expert's reasoning
→ "Decides" the Dasha expert's conclusion is sufficient
→ "Decides" to skip Sun's transit check because it's low-priority for this case
→ "Decides" to call Critic → "Reads" Critic's objection
→ "Decides" the objection is valid → "Re-evaluates" and adjusts
```

The difference: classical systems follow a **fixed path**. Agentic systems **choose their path dynamically** based on what they discover.
