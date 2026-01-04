
export type Status = 'Confirmado' | 'Em Andamento' | 'Pendente' | 'Cancelado';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: 'Macho' | 'Fêmea';
  weight: number;
  avatar: string;
  tutor: string;
}

export interface Appointment {
  id: string;
  time: string;
  pet: string;
  service: string;
  tutor: string;
  status: Status;
  avatar: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string; // Relaxed from specific union for flexibility
  duration?: string;
  price: number;
  active: boolean;
}

export interface Notice {
  id: string;
  type: 'inventory' | 'vaccine';
  title: string;
  description: string;
  time: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'product' | 'service';
  price: number;
  category: string;
  stock?: number;
}
