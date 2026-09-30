FLAMES CUSTOM ANALYTICS

This dashboard uses a custom first-party event tracker built for FLAMES.

Tracked metrics:
- unique anonymous sessions
- page views
- matches started/completed
- Classic FLAMES vs Secret Crush
- shares, downloads, copies, invites
- result distribution
- daily activity

Privacy:
- no names are sent to analytics
- no IP addresses are collected
- no Vercel Analytics is used
- no Web Analytics API is used
- no Vercel Blob is used

Storage:
The tracker writes encrypted event records through the FLAMES analytics backend.
Set ANALYTICS_GITHUB_TOKEN on the production project.

Admin:
Set ADMIN_PASSWORD on the production project.
Open /admin/
