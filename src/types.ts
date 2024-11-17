// src/types.ts
export interface Person {
  id: string;
  name: string;
  surname: string;
  address: string;
  comune: string;
  adults: number;
  children: number;
  phone: string;
  boxesNeeded: number;
  boxesReceived: number;
  completed: boolean;
  notes?: string;
  deliverySchedule: DeliverySchedule;
}

export interface DeliverySchedule {
  type: 'weekly' | 'monthly' | 'custom';
  customDays?: number[];  // Days of the month for custom schedule
  startDate: string;
  nextDelivery: string;
}

export interface DeadlineEvent {
  id: string;
  personId: string;
  date: string;
  recurring: boolean;
}