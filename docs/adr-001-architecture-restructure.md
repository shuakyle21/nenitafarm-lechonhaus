# ADR 001: Architecture Restructure & Service Pattern

## Status
Accepted

## Context
The project initially started with a flat file structure and logic tightly coupled within UI components (`App.tsx`, `DashboardModule.tsx`). As the application grows, this leads to:
- Difficulty in maintaining and testing code.
- "God Component" anti-patterns (e.g., `App.tsx` handling all data fetching).
- Inconsistent coding standards.

## Decision
We have decided to restructure the codebase to follow a modular, scalable architecture:
1.  **Source Directory (`src/`)**: Move all source code into a `src` directory to keep the root clean.
2.  **Layered Architecture**:
    *   **Presentation Layer (`components/`, `pages/`)**: UI components only.
    *   **Service Layer (`services/`)**: Encapsulates external API calls (Supabase) and business logic.
    *   **Hooks Layer (`hooks/`)**: Custom React hooks to bridge Services and Components, managing local state and side effects.
    *   **Utils (`utils/`)**: Pure utility functions.
3.  **Path Aliases**: Use `@/` alias to reference `src/` to avoid fragile relative imports (e.g. `../../`).

## Consequences
### Positive
- **Separation of Concerns**: UI is decoupled from data fetching.
- **Testability**: Services and utility functions can be unit tested in isolation.
- **Scalability**: New features can be added as new modules/services without bloating existing files.
- **consistency**: Standardized structure makes onboarding easier.

### Negative
- **Initial Refactoring Effort**: Requires moving files and updating imports (already completed).
- **Boilerplate**: Adding a new feature requires creating a Service and a Hook, rather than just adding code to a component. This is a trade-off for maintainability.

## Implementation Status
- [x] Files moved to `src/`.
- [x] Services created (`menuService`, `orderService`, etc.).
- [x] Hooks created (`useMenu`, `useOrders`, etc.).
- [x] `App.tsx` refactored to use hooks.
- [x] Tests updated to reflect new structure.
