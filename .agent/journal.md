---
### [ ] [EVENT-FEATURE-FLAG] | [2026-06-18]
- **Status**: [OK] ADOPTED
- **Objective**: Auto-pick featured event by date.
- **Hypothesis**: Data-attributes prevent date drift.
- **Approach**: data-date/start/end + Istanbul +03:00 instants.
- **Result**:
    - [States]: upcoming / live / completed
    - [Selection]: Soonest unended, else last finished.
    - [Outcome]: Success
- **The Delta**: Dates derive from flag, never hand-written.
- **Next Step**: Deploy featured-event logic.
---

---
### [ ] [EVENT-15-COMPLETED] | [2026-06-18]
- **Status**: [OK] ADOPTED
- **Objective**: Mark Talk 15 done.
- **Hypothesis**: Keep featured, not archived.
- **Approach**: Minimal HTML patch.
- **Result**:
    - [Featured]: Talk 15 completed
    - [Past]: Unchanged
    - [Outcome]: Success
- **The Delta**: Status changed only.
- **Next Step**: Deploy status update.
---

---
### [ ] [EVENT-15-UPDATE] | [2026-06-13]
- **Status**: [OK] ADOPTED
- **Objective**: Promote Talk 15.
- **Hypothesis**: API data prevents drift.
- **Approach**: Git history, Kommunity API.
- **Result**:
    - [Current]: Talk 15 featured
    - [Past]: Talk 14 archived
    - [Outcome]: Success
- **The Delta**: Updated next event cycle.
- **Next Step**: Deploy site update.
---
