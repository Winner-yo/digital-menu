// ============================================================
// Core Types for Ethiopian Digital Menu Platform
// ============================================================

export type UserRole =
  | 'SUPER_ADMIN'
  | 'RESTAURANT_OWNER'
  | 'MANAGER'
  | 'CASHIER'
  | 'KITCHEN_STAFF'
  | 'DELIVERY_STAFF';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

export type PaymentMethod = 'TELEBIRR' | 'CBE_BIRR' | 'CHAPA' | 'CASH' | 'MOCK';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  restaurantUsers?: RestaurantUser[];
}

export interface RestaurantUser {
  restaurantId: string;
  role: UserRole;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  };
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  nameAmharic?: string;
  description?: string;
  descriptionAmharic?: string;
  logo?: string;
  coverImage?: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  instagram?: string;
  facebook?: string;
  telegram?: string;
  isActive: boolean;
  taxRate: number;
  serviceCharge: number;
  minimumOrderAmount: number;
  openingHours?: OpeningHour[];
  announcements?: Announcement[];
  deliveryZones?: DeliveryZone[];
  rating?: number;
  reviewCount?: number;
}

export interface OpeningHour {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  nameAmharic?: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  category?: { id: string; name: string; nameAmharic?: string };
  name: string;
  nameAmharic?: string;
  description?: string;
  descriptionAmharic?: string;
  price: number;
  discountedPrice?: number;
  image?: string;
  images?: string[];
  isAvailable: boolean;
  isPopular: boolean;
  isBestseller: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isSpicy: boolean;
  spicyLevel: number;
  preparationTime: number;
  calories?: number;
  allergens?: string[];
  tags?: string[];
  variants?: FoodVariant[];
  addOns?: FoodAddOn[];
}

export interface FoodVariant {
  id: string;
  name: string;
  nameAmharic?: string;
  priceExtra: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface FoodAddOn {
  id: string;
  name: string;
  nameAmharic?: string;
  price: number;
  isAvailable: boolean;
  maxQuantity: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedVariant?: FoodVariant;
  selectedAddOns: Array<FoodAddOn & { quantity: number }>;
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;
  notes?: string;
  deliveryAddress?: string;
  deliveryArea?: string;
  tableId?: string;
  table?: { tableNumber: string };
  estimatedTime?: number;
  promoCode?: string;
  items: OrderItem[];
  payment?: Payment;
  statusHistory?: OrderStatusHistory[];
  restaurant?: { name: string; logo?: string; phone: string };
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  completedAt?: string;
}

export interface OrderItem {
  id: string;
  menuItemName: string;
  menuItemImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantName?: string;
  selectedAddOns?: Array<{ id: string; name: string; price: number }>;
  specialInstructions?: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  note?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  referenceId?: string;
  providerTxId?: string;
  paidAt?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  areas: string[];
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: number;
}

export interface Announcement {
  id: string;
  title: string;
  titleAmharic?: string;
  body: string;
  bodyAmharic?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  target: string;
  ownerReply?: string;
  createdAt: string;
  customer?: { name: string };
  menuItem?: { name: string };
}

export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  isActive: boolean;
}

export interface DashboardStats {
  today: { orders: number; revenue: number };
  yesterday: { orders: number; revenue: number };
  revenueChange: number;
  pendingOrders: number;
  preparingOrders: number;
  popularItems: Array<{ menuItemId: string; name: string; orderCount: number }>;
  unavailableItems: number;
  recentReviews: Review[];
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  dineIn: number;
  takeaway: number;
  delivery: number;
}

export interface AuthState {
  user: User | null;
  restaurantId: string | null;
  accessToken: string | null;
  isLoading: boolean;
}
