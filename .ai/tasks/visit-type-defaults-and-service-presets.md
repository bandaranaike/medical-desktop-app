# Visit Type Defaults And Service Presets Task

## Goal

Add backend-driven default values and faster service entry behavior across OPD, Channeling, Dental, and Others.

## Scope

- define a backend data model for default visit charges and service presets
- support doctor-specific default values where consultation or related charges differ by doctor
- support service definitions that may:
  - require a doctor
  - be usable without a doctor
  - vary in default amount by doctor
- load default values into the Visit Type section when the operator selects the relevant doctor or service
- apply this pattern consistently across OPD, Channeling, Dental, and Others
- introduce a recent-services quick-pick area:
  - show most recently used services as compact checkable labels
  - when selected, promote the service into the active input list near the top
  - prefill the active row with its default values

## Constraints

- reuse existing API routes if possible before adding new ones
- keep default-value logic out of renderer-only hardcoded maps
- preserve simple and fast data entry for non-technical operators
- recent-service chips should reduce vertical space without hiding the full editable input once selected

## Open Questions

- confirm whether recent services should be tracked globally for the whole clinic, per device, or per logged-in operator context if that is introduced later
- confirm whether defaults should be versioned historically for reporting accuracy, or only used as editable starting values during data entry
