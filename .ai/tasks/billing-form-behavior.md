# Billing Form Behavior Task

## Goal

Implement a home-page interaction model that supports the four required operation types.

## Scope

- OPD:
  - doctor selection
  - consultation fee
  - medicine fee
- Channeling:
  - doctor selection
  - consultation fee
  - channeling / booking fee
- Dental:
  - doctor selection
  - registration fee
  - optional treatments or charge rows
  - in-house and referred split display per charge row
- Others:
  - dynamic list of report/treatment charge rows

## Constraints

- Doctor data is not fully modeled in the database yet.
- UI can use a temporary data source while keeping the structure ready for future persistence.
- Totals should respond to entered values.
