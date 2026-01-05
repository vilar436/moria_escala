
import { ServiceArea, ServiceDay } from './types';

export const SERVICE_AREAS: ServiceArea[] = [
  'Recepção',
  'Café',
  'Coluna 1',
  'Coluna 2',
  'Abertura do culto',
  'Fundo da igreja'
];

export const SERVICE_DAYS: ServiceDay[] = [
  'Quinta-feira',
  'Sábado',
  'Domingo'
];

export const MOCK_USER = {
  id: 'user-1',
  name: 'Lucas Silva',
  email: 'lucas@igreja.org',
  avatar_url: 'https://picsum.photos/seed/lucas/100/100',
  role: 'ADMIN' as const
};
