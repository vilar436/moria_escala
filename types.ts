export type Role = 'ADMIN' | 'SERVO';

export interface User {
  id: string;
  name: string;
  whatsapp: string;
  role: Role;
  avatar_url?: string;
}

export type ServiceDay = 'Quinta-feira' | 'Sábado' | 'Domingo' | 'Segunda-feira' | 'Terça-feira' | 'Quarta-feira' | 'Sexta-feira';

export interface ChurchService {
  id: string;
  date: string;
  time: string;
  dayOfWeek: ServiceDay;
  isOpen: boolean;
  description?: string;
}

export type ServiceArea = 
  | 'Recepção' 
  | 'Café' 
  | 'Coluna 1' 
  | 'Coluna 2' 
  | 'Abertura do culto' 
  | 'Fundo da igreja';

export interface Assignment {
  id: string;
  serviceId: string;
  userId: string;
  userName: string;
  area: ServiceArea;
}