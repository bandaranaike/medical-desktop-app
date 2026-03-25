# TODO list

## Execution notes

- This work is API-backed. Check `.ai/resources/routes.json` before creating new routes.
- Check `.ai/resources/API_ENDPOINTS.md` for header/auth requirements before choosing routes.
- Use `.ai/resources/api-database.sql` to confirm the backend data shape.
- Keep the API base URL configurable via `.env`. Current local value: `http://test-b.local/`.
- Backend project path for route changes: `\\wsl.localhost\Ubuntu-24.04\home\eranda\test\test-b`.
- If backend edits are needed but WSL access is unavailable, prepare exact backend instructions for the user.

1. When a user types a name in the input, show suggestions. Use an API from the list .ai/resources/routes.json or create a
   new one.
2. When selecting one suggestion, autofill other input fields. for that, you can use another endpoint, or you can bring all
   the user data from the above endpoint.
3. When the user clicks on the button "Generate and print bill", need to save the user details if it is not saved and create a bill in the database using API endpoints.
4. Only continue to print after the patient save and bill creation API flow succeeds.
