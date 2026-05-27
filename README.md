# 🐷 Nenita Farm Lechon Haus - Restaurant Management System

![Status](https://img.shields.io/badge/Status-Active_Development-green)
![Stack](https://img.shields.io/badge/Stack-React_|_Vite_|_Supabase-blue)
![License](https://img.shields.io/badge/License-Private-red)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/shuakyle21/nenitafarm-lechonhaus)

A comprehensive, all-in-one Restaurant Management System (RMS) tailored for **Nenita Farm Lechon Haus and Catering Services**. This application streamlines operations from order taking to financial reporting, ensuring data accuracy and operational efficiency.

## 🚀 Features

## 🛠️ Recent Improvements

- **Offline Sync Fix**: Prevents duplicate order entries on reconnection by using a `useRef` lock in `hooks/useOfflineSync.ts`.
- **False Offline Mode Prevention**: `saveOrderWithOfflineSupport` now distinguishes network errors from other errors, avoiding accidental offline saves.
- **Delete Persistence**: Added RLS `DELETE` policies for `orders` and `order_items` in Supabase (`supabase/fix_delete_policy.sql`).

## 🏗️ Architecture

```mermaid
graph TD
    User((User))
    subgraph Frontend [React + Vite]
        UI[UI Components]
        Pages[Pages/Routes]
        Hooks[Custom Hooks]
        Utils[Utilities]
    end
    
    subgraph Backend [Supabase]
        Auth[Authentication]
        DB[(PostgreSQL)]
        Realtime[Realtime Subscriptions]
        Edge[Edge Functions]
    end
    
    User -->|Interacts| UI
    UI --> Pages
    Pages --> Hooks
    Hooks -->|Data Fetching| Lib[Supabase Client]
    Lib -->|API Calls| Backend
    
    Lib -.->|Subscribe| Realtime
    Lib -->|Auth| Auth
    Lib -->|Query| DB
```

## ⚠️ SECURITY NOTICE

**IMPORTANT**: Before running this application, please read [SECURITY_NOTICE.md](SECURITY_NOTICE.md) for critical security information.

## 🚀 Features

### 🛒 Point of Sale (POS)

- **Visual Menu:** Grid-based menu browsing with categories (Lechon, Pork, Chicken, etc.).
- **Smart Cart:** Handles weighted items (e.g., Lechon by kg) and variants (e.g., Party Trays).
- **Order Types:** Support for Dine-in, Takeout, and Delivery.
- **Discounts:** Automated calculation for Senior Citizen and PWD discounts.

### 📊 Dashboard & Analytics

- **Real-time Metrics:** Live view of Total Sales, Order Count, and Net Cash on Hand.
- **Visualizations:** Interactive charts for daily and weekly sales trends.
- **Activity Feed:** Live stream of recent orders and system actions.

### 💰 Financial Management

- **Expense Tracking:** Record and categorize daily operational expenses.
- **Sales Adjustments:** Manual entry for non-POS revenue or corrections.
- **Reports:** Generate professional PDF reports for Daily Sales and Net Income.
- **Paper POS Import:** Import sales data recorded on paper during offline periods. See [Paper POS Import Guide](docs/PAPER_POS_IMPORT.md).

### 👥 Staff & Operations

- **Staff Roster:** Manage active employees and roles.
- **Booking System:** Calendar view for catering reservations and pre-orders.

---

## 🛠️ Tech Stack

- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
- **Charts:** [Recharts](https://recharts.org/)
- **Reporting:** [React-PDF](https://react-pdf.org/)
- **Testing:** [Vitest](https://vitest.dev/)

---

## Internal Tool Notice

This repository is for internal use only. The app is not intended for public setup, self-hosting, or external deployment.

## 📂 Project Structure

/src
  ├── components/    # Reusable UI components
  ├── hooks/         # Custom React hooks (Data access, State)
  ├── services/      # API Service Layer (Supabase, Business Logic)
  ├── utils/         # Pure utility functions (Formatting, Exports)
  ├── lib/           # Supabase Client configuration
  ├── pages/         # Page components (if using router)
  ├── constants.ts   # Static data
  ├── types.ts       # TypeScript interfaces
  └── App.tsx        # Main application entry

---

## 🧪 Testing

Run the test suite using Vitest:

```bash
npm run test
```
