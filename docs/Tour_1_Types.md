# Tour 1: The Type System (DNA)

**Reference**: *Learning TypeScript* by Josh Goldberg (Chapters 4, 5, 6, & 13)

Open [src/types.ts](file:///Users/gabz_1/Downloads/nenita-farm-lechon-pos/src/types.ts) and follow along. This file is the single source of truth for the entire business.

### 1. Discriminated Unions (The "Business Logic" in types)
Look at `Category` on line 1:
```typescript
export type Category = 'Lechon & Grills' | 'Pork Dishes' | ... ;
```
**Book Connection**: Goldberg talks about "Literal Types" and "Unions".
**Reverse Engineering Insight**: By defining categories this way, TypeScript *guarantees* you can't accidentally type `'Pork Dish'` (singular) in your constants. The compiler will catch it instantly.

### 2. Interface Inheritance (Efficiency)
Look at `CartItem` on line 31:
```typescript
export interface CartItem extends MenuItem {
  cartId: string;
  quantity: number;
  ...
}
```
**Book Connection**: Look for "Interface Extension" in the index.
**Reverse Engineering Insight**: Why didn't we just copy-paste everything from `MenuItem`? Because a `CartItem` **is a** `MenuItem`, but with extra cart-specific data. If you change the price type in `MenuItem`, `CartItem` updates automatically. This is "DRY" (Don't Repeat Yourself) at the type level.

### 3. Optional Properties (Handling Nulls safely)
Look at `Order` on line 52:
```typescript
export interface Order {
  ...
  tableNumber?: string;
}
```
**Book Connection**: Check out "Optional Properties" in Chapter 4.
**Reverse Engineering Insight**: Not all orders have a table (e.g., Takeout). The `?` tells React developers: "Check if this exists before you try to display it."

---

### 🧠 Your "Homework" (Reverse Engineering Challenge):
1.  **Find the `Booking` interface** (around line 119).
2.  Identify which field is the most important for the **Calendar view**.
3.  **The Goldberg Challenge**: If you changed `status: 'PENDING' | 'CONFIRMED' | ...` to just `string`, what would happen to the safety of your application? (Don't actually do it yet, just think about it!)
