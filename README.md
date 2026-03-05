# Item Cost Calculator

A React + TypeScript app for managing quotation items, calculating cost breakdowns, and exporting project quotes to PDF.

## Overview

This project is no longer a default Vite starter. It is a complete local-first quotation tool with:

- Role-based login (`user` and `admin`)
- License-key based sign-up flow
- Admin dashboard for user and license management
- Item cost calculations (base, labor, overhead, total)
- Quotation detail form (project, customer, prepared by, quote number)
- PDF export of quotations
- English and Dutch UI support

All data is stored in the browser via `localStorage`.

## Tech Stack

- React 19
- TypeScript 5
- Vite 7
- ESLint 9

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Install and run

```bash
npm install
npm run dev
```

Open: `http://localhost:5173`

### Production build

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

## Authentication and Roles

### Default login

The app seeds a default admin user (if no users exist):

- Username: `admin`
- Password: `admin123`
- Role: `admin`

### Sign-up with license key

New users register in 2 steps:

1. Validate a license key
2. Create account credentials

A valid license determines the role of the account (`user` or `admin`).

### Default initial license

On first app load, a default admin license is initialized when no licenses exist:

- `ADMIN-DEFAULT-000000`

## Main User Flow

1. Log in as a regular `user`
2. Fill in quotation metadata:
   - Project name
   - Customer name
   - Prepared by
   - Quote number
3. Add items with:
   - Quantity
   - Unit price
   - Labor percentage
   - Overhead percentage
4. View automatic totals:
   - Base cost
   - Labor cost
   - Overhead cost
   - Grand total
5. Export the quotation as PDF

## Admin Dashboard

Admins can:

- Create users (`user` or `admin`)
- Delete users (except default `admin`)
- Generate license keys
- Revoke active licenses
- Copy license keys to clipboard

Constraint:

- Only the main `admin` user can generate `admin` licenses.

## Internationalization

Language support is built-in via a custom translation setup:

- `EN` (English)
- `NL` (Nederlands)

Language is persisted in `localStorage` under `appLanguage`.

## Data Persistence

The app uses `localStorage` keys:

- `itemList_auth` for current session auth state
- `itemList_users` for user accounts
- `itemList_licenses` for license records
- `itemList_items_<username>` for user-specific item lists
- `appLanguage` for selected UI language

## Project Structure

```text
src/
  App.tsx                # App routing logic for login/signup/admin/user flows
  main.tsx               # Entry point + LanguageProvider
  i18n.ts                # Translation dictionary and translator hook
  LanguageContext.tsx    # Language state and persistence
  LanguageSwitcher.tsx   # EN/NL switch UI

  Login.tsx              # Sign-in screen
  SignUp.tsx             # License validation + account creation
  AdminDashboard.tsx     # User and license management UI

  ItemForm.tsx           # Item input + validation
  ItemList.tsx           # Item table + totals + PDF export action
  quotePdf.ts            # Minimal in-browser PDF generator
  licenseUtils.ts        # License key generation/validation/usage helpers

  *.css                  # Component-specific styling
```

## Notes and Limitations

- This is a local-first frontend app; there is no backend/API.
- Credentials are stored in `localStorage` (not secure for production use).
- PDF generation is implemented manually in-browser without third-party PDF libraries.
- License expiry is supported in utility logic (30 days for generated keys).

## Scripts

Defined in `package.json`:

- `npm run dev` - start Vite dev server
- `npm run build` - type-check and build for production
- `npm run preview` - preview production build locally
- `npm run lint` - run ESLint
