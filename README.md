# 🐷 Nenita Farm Lechon Haus - Restaurant Management System

![Status](https://img.shields.io/badge/Status-Active_Development-green)
![Stack](https://img.shields.io/badge/Stack-React_|_Vite_|_Supabase-blue)
![License](https://img.shields.io/badge/License-Private-red)

A comprehensive, all-in-one Restaurant Management System (RMS) tailored for **Nenita Farm Lechon Haus**. This application streamlines operations from order taking to financial reporting, ensuring data accuracy and operational efficiency.

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

## 💻 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/nenita-farm-lechon-pos.git
    cd nenita-farm-lechon-pos
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory with your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

---

## 🚢 Deployment

### Staging (Azure Static Web Apps)
This project uses **Azure Static Web Apps** for staging.
- **Trigger:** Automatically deploys whenever a Pull Request is opened against `main`.
- **URL:** The staging URL is provided by the Azure bot in the PR comments.

### Production (VPS)
Production deployment is handled via a custom shell script to a VPS (Nginx).
1.  **Build:** `npm run build`
2.  **Deploy:** Run the deployment script:
    ```bash
    ./deploy.sh
    ```
    *Note: Requires SSH access to the production server.*

---

## 📂 Project Structure

```
/src
  ├── components/     # Reusable UI components and Feature Modules
  ├── lib/           # Supabase client and utility functions
  ├── constants.ts   # Static data (Menu items, configuration)
  ├── types.ts       # TypeScript interfaces (Single Source of Truth)
  └── App.tsx        # Main application entry and routing logic
/supabase
  ├── functions/     # Edge Functions (e.g., booking-webhook)
  └── seed.sql       # Database schema and initial data
```

---

## 🧪 Testing

Run the test suite using Vitest:

```bash
npm run test
```
