---
title: User‑Approved MDM Enrollment (UAMDM)
description: Standard enrollment for macOS requiring explicit user approval.
updatedDate: 2024-08-12
---

User‑Approved MDM Enrollment (UAMDM) allows users to enroll macOS devices while granting the MDM elevated trust after approval.

Flow:

- User installs the MDM profile via an onboarding portal or link
- System prompts for confirmation to grant User‑Approved status
- MDM gains access to additional management capabilities

Considerations:

- Communicate permissions clearly to avoid confusion
- Combine with SSO to tie enrollment to identity
- Apply a staged policy set after approval to avoid abrupt changes