// src/types.ts
export interface Person {
  id: string;
  name: string;
  surname: string;
  adults: number;
  children: number;
  address: string;
  comune: string;
  phone: string;
  boxes_needed: number;
  boxes_received: number;
  completed: boolean;
  notes?: string;
  delivery_schedule: DeliverySchedule;
  foodList?: FoodItem[];
}

export interface DeliverySchedule {
  type: 'weekly' | 'monthly' | 'custom';
  customDays?: number[];
  startDate: string;
  nextDelivery: string;
}

export interface FoodItem {
  id: string;
  productName: string;
  quantity: number; // in grams
  units: number;
  imageUrl?: string;
}