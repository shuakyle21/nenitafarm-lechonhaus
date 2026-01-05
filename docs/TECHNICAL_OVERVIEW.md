# Technical Overview: Deep Dive

## Data Flow Architecture
The application follows a **Service-Hook-Component** pattern for data management.

1.  **Service Layer (`src/services`)**: Contains direct interactions with the Supabase API. These are pure functions that fetch or modify data.
2.  **Hook Layer (`src/hooks`)**: Wraps services in React hooks to manage state, loading indicators, and error handling.
3.  **Component Layer (`src/components`)**: Consumes hooks to render the UI.

### Real-Time Sync & Offline Persistence
One of the "vibe" features is the robustness of data persistence.
- **Offline Mode**: Uses `localStorage` to save state during network drops.
- **Syncing**: The `useOfflineSync` hook monitors connection status and pushes locally stored changes to Supabase once the connection is restored.

## Database Schema Highlights
The backend is powered by PostgreSQL via Supabase. Key tables include:

-   **`orders`**: Stores transaction data including item details, payment status, and order numbers.
-   **`bookings`**: Stores scheduled orders with delivery/pickup dates and deposit amounts.
-   **`menu_items`**: The catalog of products with variants and base prices.
-   **`staff_actions`**: An audit log of user activities (e.g., login, price changes, deletions).

## Advanced Features

### Dynamic PDF Generation
The system uses `@react-pdf/renderer` to generate receipts and financial reports directly in the browser. This ensures that the generated documents match the internal state exactly and doesn't require a backend server for rendering.

### Financial Auditing
The system tracks "Opening Funds" and "Cash Drops" throughout the day, providing a clear audit trail for cash management.

## Project Vibe: Why it's "Coded" this way
-   **Performance**: Vite and React 19 ensure a snappy interface.
-   **Design**: Tailwind CSS 4 provides a premium, customized look without the bloat of traditional UI libraries.
-   **Maintainability**: The strict modularization allows different parts of the system (POS vs Booking) to evolve independently.
