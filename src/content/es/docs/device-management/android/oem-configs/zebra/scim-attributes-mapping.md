---
title: "Map SCIM Attributes"
description: "Applivery allows mapping SCIM attributes from various schemas into user metadata for consistent, usable, and accessible data. This process ensures critical user information is properly organized."
keywords: ['scim attributes mapping', 'applivery scim', 'user metadata mapping', 'scim attribute storage', 'custom attribute mapping', 'scim resolution rules', 'identity provider attributes', 'scim configuration']
pubDate: '2023-10-27'
updatedDate: '2023-10-27'
author: Paulo Lima
category: "Platform|Integrations"
section: "SCIM Configuration"
type: article
---

# how do you map scim attributes in applivery?

SCIM attributes mapping in Applivery allows you to standardize and store user information from various SCIM schemas into a user's metadata field. This process ensures data consistency and accessibility by translating diverse attribute structures into a unified format for Applivery.

:::Note 
Note that this is a premium feature that might not be available in your current plan. Check the availability in our [pricing page](https://www.applivery.com/pricing/).:::

When receiving user information through SCIM, the data is often organized across multiple schemas. To keep this information consistent, usable, and accessible, Applivery can map specific SCIM attributes into the user’s metadata field.

## how are scim attributes stored in applivery?

All mappable SCIM fields are automatically stored in an internal object called `attributesHistory`. This object tracks every attribute received from SCIM, whether or not it is currently mapped to metadata.

**Applivery TL;DR:**
- Map SCIM attributes to user metadata for unified, consistent data management.
- Applivery automatically records all SCIM fields in `attributesHistory` for full traceability.
- Gain granular control over user data storage by defining custom attribute mappings.

## what is the scim attributes history object?

The `attributesHistory` object contains all SCIM attributes in the following structure:

```typescript
type IProviderSCIMAttributesHistory = {
  namespace: string
  key: string
}
```

This object is populated automatically with all attributes provided in SCIM requests. Its purpose is to serve as a complete record of any field that can potentially be mapped.

## how do you create custom scim attribute mappings?

To map SCIM fields into the user’s metadata, you can define a custom mapping through the `mappedAttributes` property in the SCIM configuration model.

```typescript
type IProviderSCIMCustomAttributes = {
  name: string
  attributes?: {
    namespace?: string
    key: string
  }[]
}
```

Each mapping entry supports the following fields:

*   Name: The key under which the mapped value will be stored inside the user’s metadata.
*   Attributes: A list of SCIM attributes (optionally specifying their namespace/schema) that will be used to generate this metadata value.

Note For guidance on defining custom attributes inside your Identity Provider (IdP), refer to the following [article](https://www.applivery.com/docs/platform/integrations/platform/sso/saml/scim-attribute-creation-and-assignment-in-okta/) in our documentation.

### what resolution rules does applivery follow for scim attribute mapping?

When resolving which SCIM value to map into metadata, Applivery follows these rules:

1.  If a namespace is specified, the system searches for the SCIM attribute inside that exact namespace/schema.
2.  If no namespace is defined, the system maps the first matching attribute key found in any schema.
3.  When a SCIM payload includes a value for a mapped custom attribute, Applivery automatically writes it into the user’s metadata:
    *   Key: The name defined in the `mappedAttributes` entry.
    *   Value: The resolved SCIM attribute value based on the mapping rules.

### what is an example of namespace-based scim attribute mapping?

**scim payload**

```json
{
  "schemas": [
    "urn:ietf:params:scim:schemas:core:2.0:User",
    "urn:company:params:scim:schemas:extension:custom:2.0:User"
  ],
  "urn:ietf:params:scim:schemas:core:2.0:User": {
    "userName": "jane.smith"
  },
  "urn:company:params:scim:schemas:extension:custom:2.0:User": {
    "employeeId": "EMP-4567",
    "department": "Engineering"
  }
}
```

**custom mapping configuration**

```javascript
const mappedAttributes = [
  {
    name: "department",
    attributes: [
      {
        namespace: "urn:company:params:scim:schemas:extension:custom:2.0:User",
        key: "department"
      }
    ]
  },
  {
    name: "employeeCode",
    attributes: [
      {
        namespace: "urn:company:params:scim:schemas:extension:custom:2.0:User",
        key: "employeeId"
      }
    ]
  }
]
```

**result in user's metadata**

```json
{
  "metadata": {
    "department": "Engineering",
    "employeeCode": "EMP-4567"
  }
}
```

## how do you configure scim attribute mapping in applivery?

Go to your Workspace > Settings (1) and open the Login providers (2) section. Then click Configure (3) next to the SAML option under the MDM Portal section.

![screenshot of applivery login providers settings for scim attribute mapping](https://www.applivery.com/wp-content/uploads/2025/11/Screenshot-2025-11-25-at-162449-1024x667.png)

Scroll down to Step 3 and enter the appropriate namespace. You can determine the correct namespace based on the attribute type (Core, Enterprise, or Custom) and its value.

![screenshot of applivery scim attribute mapping configuration step](https://www.applivery.com/wp-content/uploads/2025/11/Screenshot-2025-11-25-at-163213-1024x667.png)

To save your changes, simply click Save. Once your IdP performs its next scheduled sync, the mapped attributes on both sides will begin populating each user’s metadata in Applivery.

To summarize:
*   SCIM attributes can be mapped to user metadata using `mappedAttributes`.
*   `namespace` helps disambiguate attributes when multiple schemas are involved.
*   Any unmapped SCIM attributes are stored in `attributesHistory` for future reference.
*   This mapping system gives you full control over how user data is stored and leveraged downstream.