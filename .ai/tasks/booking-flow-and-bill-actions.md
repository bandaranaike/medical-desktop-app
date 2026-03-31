 # Booking Flow And Bill Actions Task

## Goal

Introduce a booking mode in the main form so operators can save bookings separately from normal bill generation.

## Scope

- add a checkbox before the top date block to mark the current entry as a booking
- when booking mode is enabled, treat the workflow as booking creation instead of normal bill creation
- replace the single `Generate And Print Bill` action with two booking actions:
  - `Save Booking`
  - `Print Bill`
- add backend persistence for bookings through a dedicated bookings table
- add or wire an API endpoint that saves booking records
- define how booking data maps to the existing billing form fields so the operator does not need a separate screen
- when a booking is moved into payment from the booking list, show a confirmation popup asking whether to print
- if printing is confirmed, reuse the same receipt printing route used by `Generate And Print Bill` in the billing desk flow

## Constraints

- keep privileged API access in the main / preload layers
- keep the normal bill flow intact when the booking checkbox is off
- booking persistence should use a dedicated backend record type instead of overloading the bill save route unless the backend contract explicitly supports both
- if proceed-to-payment succeeds but printing fails, keep the UI aligned with the booking already moving forward and surface the print failure clearly

## Open Questions

- confirm whether `Print Bill` in booking mode should print immediately from the unsaved form state, print the saved booking, or remain disabled until `Save Booking` succeeds
- confirm whether bookings later convert into bills inside this app, and if so whether the future conversion path should preserve an explicit booking reference
