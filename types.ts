
export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  wallet_balance: number; // in DH
  discord_points: number;
  role: 'user' | 'admin';
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
  // secret_content is used to store account details or license keys for automatic delivery
  secret_content?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface PointShopItem {
  id: string;
  name: string;
  description: string;
  cost_points: number;
  image_url?: string;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  status: OrderStatus;
  price_paid: number;
  points_earned: number;
  created_at: string;
  product?: Product;
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
