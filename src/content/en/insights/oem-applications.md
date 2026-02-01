---
title: 'What is an OEM application and how can Applivery manage it for enterprise devices?'
description: 'OEM applications enable advanced hardware control on specialized devices; Applivery’s UEM platform manages these apps to optimize device configurations centrally.'
heroImage: 'https://www.applivery.com/wp-content/uploads/2025/10/OEM_Config-1536x864.jpg'
imageAlt: 'OEM applications hero image'
keywords:
  - OEM applications
  - hardware management
  - enterprise device control
  - OEMConfig
  - Applivery UEM
  - rugged devices
  - device configuration
  - Android Enterprise

pubDate: 2025-01-10
updatedDate: 2025-01-11

author: Paulo Lima
category: Documentation
section: Android
type: article

canonical: https://learn.applivery.com/insights/oem-applications/

tags: ['OEM', 'hardware management', 'enterprise devices', 'Android Enterprise', 'Applivery']

audience: developers
difficulty: intermediate
platform: Android
related:
  - /docs/device-management/oemconfig/
  - /docs/device-policies
  - /docs/uem-overview

schema_type: TechArticle
---

In any enterprise environment, OEM applications are specialized manufacturer tools that enable advanced control of device hardware features, and Applivery manages these apps to streamline and customize device configurations efficiently.

## What are OEM applications in enterprise device management?

In any enterprise environment, your devices are more than just hardware; they are critical tools. This is especially true for specialized equipment like rugged scanners, in-field tablets, or logistics terminals. To get the most out of this hardware, you need to control the specific features that make it “special.” This is where OEM (Original Equipment Manufacturer) applications come in. They are key tools for advanced device management, providing access to hardware-specific configurations and functionalities that enable deeper, more tailored control. In this post, we’ll explain what OEM apps are, how you can manage them effortlessly using Applivery’s UEM platform, and show you exactly how it works.

## What is an OEM application?

An OEM application is a tool developed by the device manufacturer itself, designed to interact directly with the device’s hardware and operating system. These apps allow you to enable or customize functions that go far beyond what native Android offers—such as specific scanner configurations, network settings, security policies, or the behavior of physical buttons. A perfect example is the OEMConfig app from Zebra. It provides a huge range of configuration options that you can control remotely from your MDM console. Some of the most important features include:
* Scanner: you can enable or disable specific scanning modes, such as batch scanning or 1D/2D barcode scanning, and adjust the scanner’s sensitivity.
* Display: it allows you to manage screen brightness, set the screen-off timeout, and control screen orientation.
* Buttons and programmable keys: you can reassign key functions, for example, to have a button activate the scanner, launch a specific application, or perform other custom tasks.
* Firmware and software updates: it simplifies the management of operating system updates and Zebra software. You can schedule updates to be installed at times that won’t disrupt daily operations.
* Network configuration: you can remotely establish network settings, ensuring secure and stable connectivity.

![Rugged devices](https://www.applivery.com/wp-content/uploads/2025/10/Rugged_Devices--768x558.jpg)

## What are the four pillars of OEMConfig: control, simplicity, speed, and security?

The OEMConfig standard is powerful because it delivers on four key promises for IT teams managing specialized hardware:
* Total control: you get a single dashboard to manage every hardware feature, from scanner settings to button mapping, across your entire fleet.
* Radical simplicity: it standardizes communication. Your MDM talks to one “OEMConfig” layer, making it effortless to manage devices from multiple brands (Zebra, Honeywell, Bluebird, etc.).
* Unmatched speed: it enables true zero-touch deployment. You can remotely configure thousands of devices in minutes, completely eliminating manual, one-by-one setup.
* Uniform security: you can apply deep, hardware-level security policies consistently everywhere, disabling features or enforcing settings to ensure compliance.

## Which major brands support OEMConfig hardware for your industry?

The power of OEMConfig comes from its wide adoption. The ecosystem of hardware manufacturers supporting this Android Enterprise standard is vast and growing. This gives you the flexibility to choose the best hardware for the job, knowing you can manage it centrally. The ecosystem is diverse, ranging from rugged specialists to corporate device leaders:
* Zebra, Getac, Unitec: all leverage OEMConfig to give you granular control over their specialized hardware, including scanners, battery-swapping features, and durability settings.
* Honeywell: a leader in rugged devices, offering specific OEM applications to optimize its scanners and mobile terminals.
* Samsung: leverages OEMConfig to provide deep control over its powerful Knox security and management suite on its Android devices.
* Panasonic: known for its Toughbook line, Panasonic uses OEMConfig to manage the unique durability and connectivity features of its rugged Windows tablets.
* Lenovo: manages its portfolio of Windows tablets and smart devices through its own OEMConfig tools.

The crucial point is this: because they all follow the same OEMConfig standard, you can manage any of them from a single platform. Applivery can remotely configure all these devices with zero custom development required.

[Explore Applivery UEM](https://www.applivery.com/demo/)

## How do you configure hardware settings in Applivery?

The bridge between these powerful apps and your IT team is a feature called Managed Properties in Applivery. This isn’t an abstract concept; it’s a direct, code-free interface. You simply add the manufacturer’s OEMConfig app (e.g., “Zebra OEMConfig”) to your Applivery app catalog. The platform automatically detects all available hardware configurations and presents them to you in an easy-to-use form. As you can see here, you can create a policy and directly control everything from scanner behavior to button mapping, right from the Applivery console.

![Zebra OEMConfig at Applivery](https://www.applivery.com/wp-content/uploads/2025/10/Zebra_OEMConfig-1024x574.png)

## What hardware settings can you control with Applivery?

When you combine Applivery’s management with OEM apps, you move from basic policy enforcement to total hardware control.
* Mass, standardized device configuration: define a configuration once and apply it across your entire device fleet. This eliminates manual at the point of [Smart Enrollments](https://www.google.com/search?q=https://www.applivery.com/uem/smart-enrollments).
* Granular control over functionalities: enable or disable specific features based on the device’s role. For example:
  * Set the default scanning mode (e.g., presentation, trigger, continuous).
  * Disable unnecessary physical buttons to simplify the user experience.
  * Control which Wi-Fi networks a device is allowed to connect to.
* User- or team-specific profiles: create different configurations for different teams. Your warehouse devices can have one setup, while your field sales devices have another—all managed from the same platform.
* Real-time updates and changes: push configuration changes at any time from the Applivery console. Devices will automatically sync and apply the updates with no re-enrollment or user interaction required.
* Reinforced security and compliance: apply policies to block unauthorized access, remove unapproved apps, or enforce encryption and data protection measures, helping you meet strict compliance standards.

![Smart enrollment at Applivery](https://www.applivery.com/wp-content/uploads/2025/10/Smart_Enrollment-1024x573.png)

## How does Applivery go beyond default management to unlock full hardware control?

A standard MDM platform only controls what native Android allows. This is where Applivery changes the game. By managing the OEM’s own app, you gain direct access to the proprietary hardware features that make your device specialized. By integrating with the manufacturer’s own OEM app, Applivery exposes its Managed Properties, giving you a direct line to advanced, device-specific controls. This allows you to configure settings that are simply impossible with standard MDM:
* Scanner control: fine-tune scanner modes and symbologies.
* Button mapping: change what physical buttons do to match your workflow.
* Network settings: assign static IPs or specific network profiles.
* System config: manually set time zones or manage OS updates.
* And dozens of other manufacturer-specific settings.

OEM applications unleash the full power of your hardware investment. Applivery provides the scalable, secure, and intuitive platform to manage that power. Whether it’s for a high-volume scanner, a locked-down [Kiosk Mode](https://www.applivery.com/blog/guides/what-is-kiosk-mode-all-you-need-to-know-to-configure-it/), or a custom-tailored device, Applivery ensures your fleet operates at peak efficiency.

![Zebra OEMConfig Policy application](https://www.applivery.com/wp-content/uploads/2025/10/Zebra_OEMConfig_Policy_Application--1024x575.png)

## How can you master your entire hardware fleet with Applivery?

See how Applivery’s platform gives you the granular, hardware-level control you need to automate setups and optimize performance.

[Book a demo](https://www.applivery.com/demo/)

## Frequently asked questions (FAQ)

### Do I need to be a developer to use OEMConfig with Applivery?

No. That is the main benefit. Applivery provides a 100% graphical interface to manage all settings. You just select the options you want from a menu; no coding or XML configuration is required.

### Does this work for any Android device?

This capability relies on the manufacturer providing an OEMConfig application. It is standard practice for major enterprise hardware providers like Zebra, Samsung, Honeywell, Panasonic, and others.

### What happens if Zebra updates its OEMConfig app with new features?

When the manufacturer updates their app, Applivery will automatically detect the new or updated Managed Properties. They will simply appear in your console as new options to configure, without you needing to wait for an Applivery platform update.

![Applivery](https://www.applivery.com/wp-content/uploads/2024/06/Applivery-Header-emails.png)

---

**Applivery TL;DR:**
- OEM apps provide deep, hardware-specific control beyond native Android capabilities.
- Applivery’s UEM platform offers a code-free interface for managing OEMConfig apps centrally.
- Manage diverse device fleets with zero-touch deployment, real-time updates, and reinforced security.