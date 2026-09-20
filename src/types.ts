export interface Product {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  gallery?: string[];
  category: 'birthday' | 'wedding' | 'anniversary' | 'get-well' | 'newborn' | 'vip';
  categoryLabel: string;
  tag?: string;
  description: string;
  flowerTypes: string[];
  inStock: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
}

export interface Category {
  id: string;
  key: Product['category'];
  name: string;
  description: string;
  image: string;
  itemCount: number;
  badge?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedRibbon?: string;
  cardMessage?: string;
  senderName?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  comment: string;
  avatar: string;
  date: string;
  verified: boolean;
  boughtProduct: string;
}

export interface OrderDetails {
  recipientName: string;
  recipientPhone: string;
  city: string;
  district: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  paymentMethod: 'cod' | 'card_cmi' | 'bank_transfer' | 'cashplus';
  cardMessage: string;
  senderName: string;
}

export interface OrderRecord extends OrderDetails {
  id: string;
  orderNumber: string;
  total: number;
  status: 'pending' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: string;
  items: {
    productId: string;
    productName: string;
    productImage: string;
    price: number;
    quantity: number;
  }[];
}

export interface StoreSettings {
  freeShippingThreshold: number;
  whatsappNumber: string;
  formattedPhone: string;
  announcementText: string;
  updatedAt?: string;
}
