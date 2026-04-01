# Booking Workspace Tabs And List Actions Task

## Goal

Introduce a tabbed workspace between the top header area and the lower content so operators can switch between billing entry and the day booking list.

## Scope

- add a tab/menu strip in the middle area using `.ai/resources/screenshot-03-30.png` as layout guidance
- keep the current billing form under the first tab and give that tab a clear clinic-facing label
- add a second tab for the booking list
- default the booking list view to today’s date
- show bookings in a table-oriented layout
- support three booking actions from the list:
  - edit
  - delete
  - proceed to payment
- define proceed-to-payment as converting the booking into a payable bill and removing it from the booking list once successful
- show a confirmation popup before proceed-to-payment finishes
- ask the operator whether the bill should be printed immediately after moving the booking into payment
- if the operator confirms printing, reuse the same receipt printer flow used by `Generate And Print Bill` in the billing desk

## Constraints

- keep the app’s API-integrated flow through main/preload boundaries
- preserve the existing single-form billing workflow in the first tab
- avoid introducing a second disconnected booking-edit screen if the current form can be reused for editing
- keep operator actions explicit and low-friction: visible rows, clear status, no hidden gestures

## API Notes

- an existing backend route is documented for booking queues:
  - `GET /api/bills/bookings/{time?}`
- this route currently requires Sanctum plus `reception|admin`, so the task must verify whether the Electron app already has a compatible authenticated session path
- if the existing bookings route cannot be used from this app because of auth or response-shape gaps, define the exact backend change needed
- delete and proceed-to-payment should reuse existing bill update/delete capabilities where possible instead of inventing parallel routes without a reason

## Open Questions

- choose the final first-tab label; candidate direction: `Billing Desk`, `Billing Form`, or `Visit Entry`
- confirm whether editing a booking should hydrate the existing form in-place or open a dedicated details pane within the bookings tab
- confirm the exact backend operation for proceed-to-payment:
  - update an existing booking bill from `booked` into the next workflow state
  - or create a new non-booking bill from booking data and delete the booking entry

## Done When

- the middle tab/menu exists and matches the intended placement between the header and content areas
- operators can switch between billing entry and the booking list without losing context unexpectedly
- the booking list loads by date, defaults to today, and supports edit/delete/proceed-to-payment actions with clear feedback
- proceed-to-payment presents a print decision popup and can finish with or without immediate printing
