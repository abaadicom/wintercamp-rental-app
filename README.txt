Winter Camp - Identity number fix

Replace only app.js and contracts.js in your existing GitHub repository.
Do not replace remote.js, other files, or Supabase Edge Functions.

- The booking nationalId field remains optional.
- Invoice shows national ID, or a dash when it was not entered.
- New contract form pre-fills ID from booking, but existing contract ID takes priority.
- Signed contracts are not modified.

Refresh the website after GitHub Pages deployment.
