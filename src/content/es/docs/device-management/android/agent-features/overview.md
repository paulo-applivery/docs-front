---
title: Overview
description: >-
  The Android Agent extends Android API limits to track device activity with
  geolocation, network traffic, and app usage reporting securely and
  efficiently.
heroImage: 'https://www.applivery.com/wp-content/uploads/2021/12/Docs-featured-image.png'
imageAlt: Applivery Android Agent dashboard showing device tracking features
itemName: Agent Overview
keywords:
  - Android Agent Features
  - Geolocation Tracking
  - App Usage Monitoring
  - Network Traffic Monitoring
  - Device Tracking Features
  - Android MDM Agent
pubDate: '2025-01-10T00:00:00.000Z'
updatedDate: '2025-01-11T00:00:00.000Z'
author: Paulo Lima
category: Device Management
section: Android MDM
type: article
canonical: >-
  https://learn.applivery.com/docs/device-management/android/agent-features/overview/
audience: developers
difficulty: intermediate
platform: Android
schema_type: TechArticle
order: 0
visible: true
---

# What is the Android Agent?
The Android Agent is a key component in Applivery's Android MDM solution that extends the native Android API to improve device activity tracking. It reports geolocation, network traffic, and app usage data securely and efficiently to help manage and monitor Android devices.

## How does the Android Agent extend Android API limitations for device tracking?

To extend Android API limitations, Applivery provides an agent app that helps better track device activity, including:

- Geolocation tracking  
- Network traffic  
- App usage  

[Applivery Android MDM Agent](https://kotlinlang.org/) is an Android app written in Kotlin that is deployed at the Policy level to report device usage periodically, depending on your subscription plan.

### Geolocation tracking

![Applivery Android Agent geolocation tracking showing device locations](https://www.applivery.com/wp-content/uploads/2022/09/Screenshot-2024-02-14-at-115513-1024x651.png)

Reports device geolocation (latitude, longitude) including full street address when available.  
You can view all reported locations from the dashboard: **Devices → (Select an Android device) → Locations**.  
Click a line item to display the map preview, and select **Open** to view it in Google Maps.

> **Note:**  
> The geolocation report is available for fully managed and COPE (Company-Owned, Personally Enabled) devices.  
> Devices with a work profile do not have access to this feature.

### App usage reporting

![Applivery Android Agent app usage report displaying weekly app usage analytics](https://www.applivery.com/wp-content/uploads/2022/09/apps-usage-report-1024x685.png)

Reports apps' usage time by querying foreground activities from Android APIs. Usage analytics appear weekly in the dashboard.  
Usage times are aggregated by package name, along with the app name and category when available.  
The top five applications are highlighted in unique colors; the rest are grouped in gray.

To view usage reports, go to **Devices → (Select an Android device) → Usage → Screen time**, then use the selector above the charts to navigate between weeks.

> **Note:**  
> Personal apps are hidden on work profile or COPE devices.  
> Fully managed devices display all installed apps.

### Network traffic monitoring

![Applivery Android Agent network traffic report showing WiFi and mobile data usage](https://www.applivery.com/wp-content/uploads/2022/09/network-traffic-report-1024x685.png)

Reports each app’s incoming and outgoing network traffic in megabytes using Android network usage APIs.  
Analytics are displayed weekly. Network usage is aggregated by package name, including app name and category where available.  
The top five applications are color-coded; remaining usage data appears in gray.

To access analytics, go to **Devices → (Select an Android device) → Usage → Network** and use the date selector above the charts.  
Use the blue filters to toggle between WiFi and Mobile data, or Received vs. Transmitted traffic.

## Features by subscription plan

| Feature | Starter Plan | Advanced Plan |
|----------|--------------|---------------|
| **Geolocation tracking** | Sync every 1h, retain 1 week | Sync every 15 min, retain 1 month |
| **Network traffic** | Sync every 24h, retain 1 week | Sync every 12h, retain 1 month |
| **App usage** | Sync every 24h, retain 1 week | Sync every 12h, retain 1 month |

> **Note:**  
> The Agent app follows the sync frequency in the table above. However, Android may prioritize other processes depending on network conditions, battery optimization, or doze mode.  
>
> Some manufacturers modify Android, hiding or removing background execution permissions. This does not impact reporting — the Agent continues functioning properly on such devices.

## Data security and privacy

Applivery takes data security seriously, especially for sensitive device data.  
The Android MDM Agent uses end-to-end encryption with **SHA-256** and **SSL/TLS 1.3** protocols.  
All tracking data is encrypted at runtime and protected both in transit and at rest.

## Enabling the Android Agent at the Policy level

The Applivery Android Agent is enabled and managed from Policy settings.  

Go to **Device Management → Policies**, filter by Android, and select a policy.  
Open the **Agent** section from the left menu.

![Enable Android Agent within Applivery policy settings](https://www.applivery.com/wp-content/uploads/2022/09/Screenshot-2024-02-14-at-120052-1024x651.png)

Click **Enable** in the top-right corner to activate the Agent.  
Then choose between:

- **Required for Setup** — installs the Agent during device setup (recommended).  
- **Force Installed** — installs automatically and cannot be removed.

Remember to click **Save changes** to apply and deploy updates.

> **Note:**  
> The Android Agent deploys to all devices associated with the policy.  
> It must be opened at least once and granted permissions before reporting begins.

## Programmatically launching the Android Agent

The Agent needs to be opened once to obtain required permissions.  
You can also launch it programmatically from another app using an Intent:

```kotlin
val intent = Intent("com.applivery.mdm_agent.action.LAUNCH")
if (packageManager.queryIntentActivities(intent, 0).isNotEmpty()) {
    startActivity(intent)
}
```

**Note:** Starting with Android 11, package visibility filters apply.  
To ensure discoverability, include the following queries in your app manifest:

```xml
<queries>
    <intent>
        <action android:name="com.applivery.mdm_agent.action.LAUNCH" />
    </intent>
</queries>
```

## Applivery TL;DR

- The Android Agent extends Android API limits for advanced device tracking: geolocation, app usage, and network monitoring.  
- Advanced plans unlock more frequent syncing and longer data retention.  
- End-to-end encryption protects all tracked data during transmission and at rest.
