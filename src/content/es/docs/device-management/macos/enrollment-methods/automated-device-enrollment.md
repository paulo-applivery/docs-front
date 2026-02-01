---
title: Automated Device Enrollment (ADE) for macOS
description: Integrate ABM/ASM to automate setup and apply baseline policies.
updatedDate: 2024-08-12
---

Automated Device Enrollment (ADE) integrates Apple Business Manager (ABM) or Apple School Manager (ASM) with your MDM to provision macOS devices with minimal user interaction.

Key steps:

- Sync device purchases into ABM/ASM and assign to your MDM server
- Configure the Setup Assistant experience (skip panes, enforce supervision)
- Apply baseline configuration profiles and security policies post‑enrollment
- Verify device assignment and test recovery workflows

Best practices:

- Maintain multiple MDM servers for segmented environments
- Use enrollment customization for privacy and compliance messaging
- Apply FileVault, Gatekeeper, and firewall profiles immediately after enrollment