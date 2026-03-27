# Patient Identity And Autofill Task

## Goal

Align the patient section of the main window with the updated registration, date-of-birth, age, and autocomplete behavior requirements.

## Scope

- move the registration number input next to the telephone field in the top patient details area
- persist registration number in the app database and expose it through the API-backed patient search / save flow
- replace the single age field with:
  - date of birth input using `DD/MM/YYYY`
  - age input beside it with narrower width
- keep date of birth and age synchronized:
  - if date of birth changes, calculate age
  - if age changes, calculate date of birth
- update autocomplete selection behavior so an existing matched patient is updated only when the operator is still working on the same person
- when both patient name and telephone differ from the selected autocomplete result, clear the autocomplete link and treat the entry as a new patient

## Constraints

- keep patient search and persistence aligned with the Electron main / preload / renderer boundary
- prefer API-backed patient save and lookup behavior where routes support it
- keep the registration number configurable through the same patient payload instead of introducing renderer-only state
- date calculations should stay predictable for clinic operators and avoid surprising auto-overwrites

## Open Questions

- confirm whether date of birth should become the persisted source of truth and age should be derived at runtime, or whether both values should be stored
- confirm the expected behavior when only one field changes after autocomplete selection:
  - same patient and update existing record
  - or require an explicit "new patient" action before creating another record
