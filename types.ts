export type Category =
  | 'Lechon & Grills'
  | 'Pork Dishes'
  | 'Beef Dishes'
  | 'Chicken Dishes'
  | 'Seafood'
  | 'Vegetables'
  | 'Short Orders'
  | 'Desserts'
  | 'Soup'
  | 'Party Trays'
  | 'Extras'
  | "Today's Menu";

export interface Variant {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  isWeighted?: boolean; // If true, triggers the weight/price modal
  description?: string;
  variants?: Variant[];
}

export interface CartItem extends MenuItem {
  cartId: string; // Unique ID for the cart entry
  quantity: number;
  weight?: number; // For weighted items like Lechon
  finalPrice: number; // Calculated price based on weight or quantity
  selectedVariant?: Variant; //For small | medium | large servings
}

export type DiscountType = 'SENIOR' | 'PWD' | 'NONE';

export interface DiscountDetails {
  type: DiscountType;
  idNumber: string;
  name: string;
  totalPax: number; // Total number of people dining
  numberOfIds: number; // Number of Senior/PWD cards presented
  amount: number; // Percentage (e.g., 0.20)
}

export type OrderType = 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: DiscountDetails | null;
  total: number;
  cash: number;
  change: number;
  orderType?: OrderType;
  orderNumber?: number;
  deliveryAddress?: string;
  deliveryTime?: string;
  contactNumber?: string;
  tableNumber?: string;
  paymentMethod?: string;
  paymentReference?: string;
}

export type CashTransactionType = 'OPENING_FUND' | 'CASH_DROP' | 'CLOSING_FUND' | 'EXPENSE';

export interface CashTransaction {
  id: string;
  amount: number;
  type: CashTransactionType;
  description?: string;
  performed_by: string;
  created_at: string;
}

export interface SavedOrder {
  id: string;
  name: string; // Auto-generated name e.g., "Order #1 - 10:30 AM"
  timestamp: Date;
  items: CartItem[];
  discount: DiscountDetails | null;
  orderType: OrderType;
  deliveryDetails?: {
    address: string;
    time: string;
    contact: string;
  };
}

export interface Staff {
  id: string;
  name: string;
  role: 'Server' | 'Cashier' | 'Manager' | 'Kitchen';
  pin: string;
  status: 'ACTIVE' | 'INACTIVE';
  image_url?: string;
  daily_wage?: number;
}

export interface Attendance {
  id: string;
  staff_id: string;
  clock_in: string;
  clock_out?: string;
  date: string;
  status?: 'PRESENT' | 'ABSENT';
  notes?: string;
}

export interface Booking {
  id?: string;
  customer_name: string;
  contact_number: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:mm
  pax: number;
  type: 'CATERING' | 'RESERVATION' | 'PRE_ORDER';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  created_at?: string;
  items?: CartItem[];
  payment_method?: 'CASH' | 'GCASH' | 'MAYA';
  total_amount?: number;
}

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  requested_by: string;
  date: string;
}

export interface SalesAdjustment {
  id: string;
  amount: number;
  reason: string;
  added_by: string;
  date: string;
}