
export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  wallet_balance: number; // in DH
  discord_points: number;
  role: UserRole;
  avatar_url?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price_dh: number;
  category: string;
  stock: number;
  image_url?: string;
  type: 'account' | 'key' | 'service';
  secret_content?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  status: OrderStatus;
  price_paid: number;
  points_earned: number;
  delivery_data: string;
  created_at: string;
  products?: Product;
}

export interface PointShopItem {
  id: string;
  name: string;
  description: string;
  cost_points: number;
  image_url?: string;
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  role_required: string;
  prize_pool: string;
  status: 'upcoming' | 'ongoing' | 'finished';
  date: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_id: string;
  details: any;
  description: string;
  created_at: string;
  profiles?: UserProfile;
}
