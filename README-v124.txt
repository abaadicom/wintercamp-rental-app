Winter Camp v124 — only two requested improvements:
1. Print and screen: stamp.png is positioned on the physical left of «اعتماد المؤجر»; logo remains unchanged.
2. Remote contract approval: while the app is open, an authenticated manager session silently checks pending contracts every ~12 seconds and updates status automatically. Checks also run when returning to the tab or restoring connectivity. No login prompt from background checks. If the manager session is unavailable, login is required through an existing contract action.
No database schema changes or Edge Function redeployment needed. Existing booking/invoice data is not changed.
IMPORTANT: Keep existing invoice_logo.png, logo.png, and stamp.png files in GitHub. Upload the ZIP contents, not the ZIP itself.
