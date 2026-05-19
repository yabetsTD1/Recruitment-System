# INSA Keycloak Theme

## Installation

1. Copy the `insa` folder to your Keycloak themes directory:

```
<keycloak-install-dir>/themes/insa/
```

For example, if Keycloak is at `C:\keycloak`:
```
C:\keycloak\themes\insa\
```

2. Restart Keycloak.

3. In Keycloak Admin Console:
   - Go to **Realm Settings** → **Themes**
   - Set **Login Theme** to `insa`
   - Click **Save**

## What it does

- Replaces Keycloak's default login UI with the INSA staff login design
- Same background image, card layout, and color scheme as the original login page
- Shows INSA-ERP logo and branding
- Includes show/hide password toggle
- "Back to Public Site" link returns to localhost:3000
