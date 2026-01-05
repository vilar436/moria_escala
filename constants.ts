import { ServiceArea, ServiceDay, User } from './types';

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

export const MOCK_USER: User = {
  id: 'user-1',
  name: 'Lucas Silva',
  whatsapp: '(11) 99999-9999',
  role: 'ADMIN' as const
};