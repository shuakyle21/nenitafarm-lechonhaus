# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Standalone receipt paper view for cleaner thermal-printer output
- Reusable validation helpers for the login screen and Paper POS import

### Changed
- Accessibility pass across all modals and forms: every input is now tied to a
  visible label, action buttons declare an explicit type, and interactive
  controls expose ARIA labels for screen readers
- Keyboard navigation now shows a focus-visible outline on the active control

## [1.0.0] - 2026-06-05

First stable release of the Nenita Farm Lechon Haus point-of-sale system.

### Added

#### Point of Sale
- Take orders with a live cart, including weighted lechon items priced by the kilo
- Preset price buttons and quantity presets for fast lechon entry
- Variant and add-on selection for menu items
- Record table number and server name on each order
- Apply discounts at checkout
- Capture payment method and reference number per order
- Save and reload in-progress orders
- Loading state on order confirmation to prevent duplicate submissions
- Offline sync so the till keeps working when the connection drops

#### Receipts
- Print order receipts and reprint from order history
- Generate booking receipts
- Weighted items and full order detail shown on the receipt

#### Menu & Bookings
- Today's menu management with categories, including Party Trays
- Bookings module with a dedicated item selector

#### Financials
- Financial ledger with expenses, sales adjustments, cash drops, opening fund,
  and "add to net sales" entries
- Custom date-range financial reports
- Export reports to PDF, Excel, and CSV
- PDF reports include the company logo and itemized order detail with totals

#### Staff Management
- Staff directory with a detailed per-member view (personal info, employment
  details, salary, and payroll history)
- Attendance tracking
- Payroll generation with PDF payslips, plus bulk payroll runs
- Cash advance tracking
- Staff transactions folded into the financial totals

#### Paper POS Import
- Import historical sales and expense records from paper POS sheets
- Inline validation while entering import data
- Dedicated Import Records view

#### Dashboard
- At-a-glance top menu items and key figures

#### Access & Platform
- Role-based access control for navigation and modules
- Login with role-specific routing and clear, specific error messages
- Mobile logout
- Mobile-first responsive layouts with a persistent bottom-drawer cart, a
  floating cart summary button, and a bottom navigation bar with a "More" menu
- iOS safe-area handling and fixes for input-focus zoom
- App favicon and Apple Touch (home-screen) icon

### Security
- Removed exposed credentials from the codebase and fixed an authentication
  bypass

### Infrastructure
- Continuous deployment via Azure Static Web Apps
- Application monitoring through Azure Application Insights
- Vitest test suite covering financial reporting, order persistence, login, and
  Paper POS import validation

[Unreleased]: https://github.com/shuakyle21/nenitafarm-lechonhaus/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/shuakyle21/nenitafarm-lechonhaus/releases/tag/v1.0.0
