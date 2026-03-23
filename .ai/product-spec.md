# Product Specification

## Product purpose

- This application is for a medical center.
- The main outcome is to generate doctor appointment and billing reports.
- The operators are non-technical, so the workflow must stay simple, direct, and low-friction.

## Core data

### Patient data

- Patient name
- Patient telephone number
- Patient email
- Patient age
- Patient address

### Doctor data

- Doctor name
- Doctor telephone number
- Doctor email
- Doctor address
- Doctor specialty

Doctor details are expected to already exist in the database.

## Patient search and autofill

- When the operator enters a telephone number, the app should search the patient by telephone and autofill the other available patient details.
- When the operator enters a patient name, the app should search the patient by name and autofill the other available patient details.

## Shift selection

- The operator must always select a shift.
- Supported shifts:
  - Morning
  - Evening

## Operation types

There are four operation types. The UI may present them differently, but they should behave like separate modes.

### OPD

- A doctor must be selected.
- Main charge fields:
  - Doctor consultation fee
  - OPD medicine fee

### Channeling

- A doctor must be selected.
- Main charge fields:
  - Doctor consultation fee
  - Channeling medicine fee

### Dental

- A doctor must be selected.
- Main charge field:
  - Dental registration fee
- Optional charge fields may include:
  - Dental consultation fee
  - Dental medicine fee
  - Dental surgery fee
- Every dental charge must be split into:
  - In-house fee
  - Referred fee
- The in-house fee can be either:
  - a fixed amount
  - a percentage
- The split rule may vary by doctor.

### Others

- This mode is dynamic.
- It should support additional charge types such as:
  - report charges
  - wound treatment
  - similar ad hoc treatments or services

## Reporting and printing

- The app must provide a button to generate the report and print it.
- Reporting and printable billing output are first-class features, not secondary add-ons.

## UX principles

- Keep data entry fast and obvious.
- Reduce repeated typing through search and autofill.
- Prefer explicit labels and practical layouts over compact or clever UI.
- Design for desktop operator workflows first.
