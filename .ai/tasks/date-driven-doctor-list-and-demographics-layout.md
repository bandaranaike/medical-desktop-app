# Date-Driven Doctor List And Demographics Layout Task

## Goal

Update the billing form so doctor choices respond to the selected date, and tighten the patient identity row layout for date of birth and age.

## Scope

- refresh the doctor list whenever the bill date changes because doctor availability is date-specific
- stop treating the doctor selector as date-agnostic seed data for this flow
- use the selected date when requesting doctor options from the main/preload layer
- update the patient info layout so `Date of birth / Age` together match the width of a single full field like `Telephone` or `Name`
- within that shared width, keep date of birth at roughly `75%` and age at roughly `25%`

## Constraints

- keep API and privileged data access in main/preload, not directly in the renderer
- prefer backend-backed doctor availability over local temporary doctor lists when a suitable route exists
- preserve the current fast-entry workflow for non-technical clinic operators
- avoid making the identity grid denser than the existing form can comfortably support on desktop

## API Notes

- relevant discovery routes already documented:
  - `GET /api/doctor-availabilities/get-today-doctors`
  - `GET /api/doctor-availabilities/search-booking-doctors?date=YYYY-MM-DD&type=...`
- confirm which route best matches the billing form doctor list by date and operation type
- if no existing route can return the needed doctor set for the selected date, define the missing backend contract before wiring the UI

## Done When

- changing the selected date updates the available doctors for the active operation
- doctor defaults reset safely when the previously selected doctor is no longer available on the chosen date
- the date of birth and age controls render in the requested `75/25` width split without breaking the current layout
