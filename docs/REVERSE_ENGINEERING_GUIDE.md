# The Syllabus: Reverse Engineering Nenita Farm POS

This guide is designed for a CS fresh grad to bridge the gap between textbook theory and a production-ready application. We will use **"Learning TypeScript" (LT)** and **"React and React Native" (RRN)** as our lenses.

## Phase 1: The DNA (TypeScript & Data Structures)
*Objective: Understand the "what" of the system.*

| Focus Area | File | Book Reference | Key Concept |
| :--- | :--- | :--- | :--- |
| **Domain Entities** | `src/types.ts` | LT: Ch 4 (Objects) & 5 (Arrays) | Interfaces, Union Types, and Optional Properties. |
| **Menu System** | `src/constants.ts` | LT: Ch 6 (Interfaces) | How static data is structured to prevent errors. |
| **Type Safety** | `src/lib/supabase.ts` | LT: Ch 11 (Declaration Files) | How raw DB data is mapped to TS types. |

## Phase 2: The Heartbeat (React State & Hooks)
*Objective: Understand the "how" of the business logic.*

| Focus Area | File | Book Reference | Key Concept |
| :--- | :--- | :--- | :--- |
| **Core State** | `src/hooks/useOrders.ts` | RRN: Ch 3 (Managing State) | `useState`, array manipulation, and immutability. |
| **Real-time Sync** | `src/hooks/useOfflineSync.ts` | RRN: Ch 7 (Life Cycle) | `useEffect`, cleanup functions, and connection monitoring. |
| **Complex Logic** | `src/hooks/useInventory.ts` | RRN: Ch 5 (Reusable Hooks) | Abstracting data logic away from the UI. |

## Phase 3: The Skin (Components & Styling)
*Objective: Understand the "look and feel" and interactions.*

| Focus Area | File | Book Reference | Key Concept |
| :--- | :--- | :--- | :--- |
| **Modular UI** | `src/components/PosModule.tsx` | RRN: Ch 4 (Composition) | Passing props, handling events, and child components. |
| **Conditionals** | `src/components/VariantSelector.tsx`| RRN: Ch 4 (JSX) | Conditional rendering based on item type. |
| **Advanced Tools** | `src/components/FinancialReportPDF.tsx`| RRN: Ch 6 (Libraries) | Integrating 3rd party rendering engines. |

## Phase 4: The Bridge (Services & Backend)
*Objective: Understand how the app talks to the world.*

| Focus Area | File | Book Reference | Key Concept |
| :--- | :--- | :--- | :--- |
| **API Layer** | `src/services/orderService.ts` | RRN: Ch 8 (Storage) | Promises, Async/Await, and error handling. |
| **Auth** | `src/components/LoginModule.tsx` | Supabase Docs | Managing session state and protected actions. |

---

### How to use this guide:
1.  **Read the Book Chapter first.**
2.  **Open the corresponding file** in the project.
3.  **Find 3 lines of code** that demonstrate a concept mentioned in the chapter.
4.  **Try to change one thing** (e.g., add a new field to `MenuItem` in `types.ts`) and see how many files "turn red" with TypeScript errors.
