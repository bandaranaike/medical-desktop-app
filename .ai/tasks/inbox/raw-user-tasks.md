# Raw User Tasks

Use this file to drop task ideas in your own language.

## How To Use

- Write in any language.
- Short notes are fine.
- One line or one small paragraph per idea is enough.
- The agent should read this file, combine related items into one structured task file when practical, and then track
  the structured task in `.ai/tasks/registry.md`.

## Existing Raw Notes

### 2026-04-01

#### Billing Desk

##### Others

- In the Billing Desk, Others tab, users can add their own items to the bill.
- Those items need to be treated as new services.
- So we have to include them in the bill creation API request.
- If the request body has existing services, then it will be separated from the API backend
- When the user types, need to auto-complete the service name.
- We may need a new API to get the list of services. In the API database has two columns: `db.services.bill_price` and
  `db.services.system_price`. those are Referred and In-house prices respectively.
- The doctor for other services is optional. User could be able to select the "no doctor" option.
- Create a document for all the changes of the API. It will be useful for the API team to do the changes.
- Remove the In-house and Referred blocks. Make the one input in to two as In-house and Referred. Even in dental, we
  have to have two inputs the same as here. We have to send in-house and referred prices separately in the API.

##### Channelling

- Doctor consultation fee is referred while the channeling / booking fee is in-house.
- The above two values should be autofilled using the API. It depends on the selected doctor.

##### Dental

- The registration fee is in-house.
- Other fees have two parts: in-house and referred. Treat as above other services as having two inputs.
- Services should be autofilled using the API.


If you have any unclear points, please ask me. We may need to modify the API and add new endpoints. Please create a new
document for the API changes. It will helpfull for the API team and the API AI agent.
