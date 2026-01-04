
import { Appointment, Service, Notice } from './types';

export const RECENT_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    time: '09:00',
    pet: 'Thor',
    service: 'Banho e Tosa',
    tutor: 'Maria Silva',
    status: 'Confirmado',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDh708WefCAbkHqDEbyfzN3ZxtE5tSsEaGBuSyR_E4AFi692H7lnv5ilQzqSltTarfcesKmh-XREolk1WLozAzCrF--_FyE3Xtz2zl4gSeyNh0fzQjVp2-fNnZ8Ewr5C5SS5CSPI9zGFAM0A8gRIg0kA6Xi_DgHw1gT9P4bd5Suvqfc8wDvcnP9lf3PMhGdLH-XraNCxQzTUESRfBPKA0F40zX6fmrQEVy-ikzdphWv2Zeqxxy0xIlW073_itrb5258N2rFh68M1g',
  },
  {
    id: '2',
    time: '10:00',
    pet: 'Luna',
    service: 'Consulta Vet',
    tutor: 'João Santos',
    status: 'Em Andamento',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTOPMzGwnSJcXodjCujhTZbcV_uiMWCIA3YcJ1W3p4av-gIC2D89CNAEL5bAYszkGdtL90plWYFOg6NVjU7uBnNKspPCvrT6jAKwy0UqVK2_ZfYiJYWQUVe7A6q7pU12063IJAC3xjE2GfnythUtZEMRLB1eL-TztjNosA1U2IsTnYMGr06fPlpB01cGrMAFgwsuyOb9yyFVL1CA3wewMeYiiX2oo1VHY8otoilcssldJHQyOvsEAlGRoAz8OZzOzL0vJGczS8yg',
  },
  {
    id: '3',
    time: '11:30',
    pet: 'Belinha',
    service: 'Banho',
    tutor: 'Ana Costa',
    status: 'Pendente',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZS-_cChSNQoyQlwHPJdGbLh4ZStaZTizwo-4jSWBlJUKNNEJ_T4YRpUyq6nq7UzEt0yuRckBX8GtT4oHGIvyWddASpXMD3L3n36Ogz6KYURrEVDBPrA7qt8guWGS0IjZwEBRSyyn6vM6O9ToUo0HM3KxHPJz3YMbKHVQzcGLHSuPeTEx4lC_VKb2r5lshxSU_1TLUxyrV3iBRpxxL83bnv2IMmFden44O-gRlM-MpUz2qN8zEks_qnO0uBYaaL7kJwk8YUuLdZQ',
  },
  {
    id: '4',
    time: '13:00',
    pet: 'Max',
    service: 'Vacinação',
    tutor: 'Pedro Souza',
    status: 'Confirmado',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCn4xeJFBlvcOiW3QRYUWy8sbud6Va_Dbry1ZssJdYbogRQjfECpWziKelA1GmOuaVujPe9ghrnD2Y6gb2tKPn7f5nUl-mAkcyb0TMC5qWAGDto0SH_HhC8P0j94A2wTmkefSXmwxyFicO5a08RMO4e-i3AHp-OsRUO9XEvh0A6qRQlow-DxUC_5a6U_OcEZixFwnJ5ASynknxftiEBfRRRxbPtlR1yWAzKBuhXVgwTjrbfX-UTsN_s6JHTiADNRcWIWRLxWUtHQ',
  },
  {
    id: '5',
    time: '14:15',
    pet: 'Mimi',
    service: 'Tosa Higiênica',
    tutor: 'Carla Dias',
    status: 'Cancelado',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgeqeXOF5EM7PisbJQ88JXU17q6z1t8OYrD20LDCwL0lE3Ln2d_wRb4XmrM8ayHYD0_Re03AkUaAWnmqGiUD60Zxv8snfxuwBPAxCIpqFdUV2sofhLzVKuG1YY1LpaEoWIIehGG_NJjLu4Netg2ifbMa19I4qwvwrxxdwKCpwHfOPnvaKsg2yfmuSTVllD2Gxmc3-EZS_PiXH4fEYZIpqKcEwe0fNDJmf4r-rTGvKFmrxJPGPDJHateG7mg-ffec22WG4S86XGqQ',
  },
  {
    id: '6',
    time: '15:00',
    pet: 'Bob',
    service: 'Banho',
    tutor: 'Roberto Lima',
    status: 'Confirmado',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDh708WefCAbkHqDEbyfzN3ZxtE5tSsEaGBuSyR_E4AFi692H7lnv5ilQzqSltTarfcesKmh-XREolk1WLozAzCrF--_FyE3Xtz2zl4gSeyNh0fzQjVp2-fNnZ8Ewr5C5SS5CSPI9zGFAM0A8gRIg0kA6Xi_DgHw1gT9P4bd5Suvqfc8wDvcnP9lf3PMhGdLH-XraNCxQzTUESRfBPKA0F40zX6fmrQEVy-ikzdphWv2Zeqxxy0xIlW073_itrb5258N2rFh68M1g',
  },
  {
    id: '7',
    time: '16:30',
    pet: 'Mel',
    service: 'Consulta Vet',
    tutor: 'Fernanda Oliveira',
    status: 'Pendente',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTOPMzGwnSJcXodjCujhTZbcV_uiMWCIA3YcJ1W3p4av-gIC2D89CNAEL5bAYszkGdtL90plWYFOg6NVjU7uBnNKspPCvrT6jAKwy0UqVK2_ZfYiJYWQUVe7A6q7pU12063IJAC3xjE2GfnythUtZEMRLB1eL-TztjNosA1U2IsTnYMGr06fPlpB01cGrMAFgwsuyOb9yyFVL1CA3wewMeYiiX2oo1VHY8otoilcssldJHQyOvsEAlGRoAz8OZzOzL0vJGczS8yg',
  },
  {
    id: '8',
    time: '09:30',
    pet: 'Simba',
    service: 'Banho e Tosa',
    tutor: 'Ricardo Alves',
    status: 'Confirmado',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZS-_cChSNQoyQlwHPJdGbLh4ZStaZTizwo-4jSWBlJUKNNEJ_T4YRpUyq6nq7UzEt0yuRckBX8GtT4oHGIvyWddASpXMD3L3n36Ogz6KYURrEVDBPrA7qt8guWGS0IjZwEBRSyyn6vM6O9ToUo0HM3KxHPJz3YMbKHVQzcGLHSuPeTEx4lC_VKb2r5lshxSU_1TLUxyrV3iBRpxxL83bnv2IMmFden44O-gRlM-MpUz2qN8zEks_qnO0uBYaaL7kJwk8YUuLdZQ',
  },
  {
    id: '9',
    time: '10:45',
    pet: 'Nina',
    service: 'Vacinação',
    tutor: 'Camila Santos',
    status: 'Em Andamento',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCn4xeJFBlvcOiW3QRYUWy8sbud6Va_Dbry1ZssJdYbogRQjfECpWziKelA1GmOuaVujPe9ghrnD2Y6gb2tKPn7f5nUl-mAkcyb0TMC5qWAGDto0SH_HhC8P0j94A2wTmkefSXmwxyFicO5a08RMO4e-i3AHp-OsRUO9XEvh0A6qRQlow-DxUC_5a6U_OcEZixFwnJ5ASynknxftiEBfRRRxbPtlR1yWAzKBuhXVgwTjrbfX-UTsN_s6JHTiADNRcWIWRLxWUtHQ',
  },
  {
    id: '10',
    time: '11:15',
    pet: 'Fred',
    service: 'Corte de Unhas',
    tutor: 'Gustavo Lima',
    status: 'Confirmado',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgeqeXOF5EM7PisbJQ88JXU17q6z1t8OYrD20LDCwL0lE3Ln2d_wRb4XmrM8ayHYD0_Re03AkUaAWnmqGiUD60Zxv8snfxuwBPAxCIpqFdUV2sofhLzVKuG1YY1LpaEoWIIehGG_NJjLu4Netg2ifbMa19I4qwvwrxxdwKCpwHfOPnvaKsg2yfmuSTVllD2Gxmc3-EZS_PiXH4fEYZIpqKcEwe0fNDJmf4r-rTGvKFmrxJPGPDJHateG7mg-ffec22WG4S86XGqQ',
  },
  {
    id: '11',
    time: '13:45',
    pet: 'Lola',
    service: 'Banho',
    tutor: 'Patricia Silva',
    status: 'Pendente',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDh708WefCAbkHqDEbyfzN3ZxtE5tSsEaGBuSyR_E4AFi692H7lnv5ilQzqSltTarfcesKmh-XREolk1WLozAzCrF--_FyE3Xtz2zl4gSeyNh0fzQjVp2-fNnZ8Ewr5C5SS5CSPI9zGFAM0A8gRIg0kA6Xi_DgHw1gT9P4bd5Suvqfc8wDvcnP9lf3PMhGdLH-XraNCxQzTUESRfBPKA0F40zX6fmrQEVy-ikzdphWv2Zeqxxy0xIlW073_itrb5258N2rFh68M1g',
  },
  {
    id: '12',
    time: '15:30',
    pet: 'Toddy',
    service: 'Consulta Vet',
    tutor: 'Lucas Ferreira',
    status: 'Confirmado',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTOPMzGwnSJcXodjCujhTZbcV_uiMWCIA3YcJ1W3p4av-gIC2D89CNAEL5bAYszkGdtL90plWYFOg6NVjU7uBnNKspPCvrT6jAKwy0UqVK2_ZfYiJYWQUVe7A6q7pU12063IJAC3xjE2GfnythUtZEMRLB1eL-TztjNosA1U2IsTnYMGr06fPlpB01cGrMAFgwsuyOb9yyFVL1CA3wewMeYiiX2oo1VHY8otoilcssldJHQyOvsEAlGRoAz8OZzOzL0vJGczS8yg',
  }
];

export const SERVICES: Service[] = [
  {
    id: '1',
    name: 'Banho Completo',
    description: 'Inclui shampoo, condicionador e secagem',
    category: 'Estética',
    duration: '60 min',
    price: 80.0,
    active: true
  },
  {
    id: '2',
    name: 'Consulta Veterinária',
    description: 'Exame clínico geral',
    category: 'Saúde',
    duration: '30 min',
    price: 150.0,
    active: true
  },
  {
    id: '3',
    name: 'Corte de Unhas',
    description: 'Corte e lixamento',
    category: 'Higiene',
    duration: '15 min',
    price: 20.0,
    active: true
  },
  {
    id: '4',
    name: 'Tosa Higiênica',
    description: 'Regiões íntimas e patas',
    category: 'Estética',
    duration: '30 min',
    price: 45.0,
    active: false
  },
  {
    id: '5',
    name: 'Vacina V10',
    description: 'Aplicação de dose única',
    category: 'Saúde',
    duration: '20 min',
    price: 95.0,
    active: true
  }
];

export const NOTICES: Notice[] = [
  {
    id: 'n1',
    type: 'inventory',
    title: 'Estoque Baixo',
    description: 'Shampoo Antipulgas (3 un.)',
    time: '2h atrás'
  },
  {
    id: 'n2',
    type: 'vaccine',
    title: 'Vacina Vencida',
    description: 'Lote #4920 expira hoje',
    time: '5h atrás'
  }
];

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/agenda', label: 'Agenda', icon: 'calendar_month' },
  { to: '/clientes', label: 'Clientes', icon: 'groups' },
  { to: '/pets', label: 'Pets', icon: 'pets' },
  { to: '/produtos', label: 'Produtos', icon: 'shopping_bag' },
  { to: '/servicos', label: 'Serviços', icon: 'inventory_2' },
  { to: '/financeiro', label: 'Financeiro', icon: 'payments' },
  {
    to: '/drex',
    label: 'Drex',
    icon: 'account_balance_wallet',
    badge: { text: '✨ Novidade', color: 'bg-yellow-500 text-white' }
  },
  { to: '/configuracoes', label: 'Configurações', icon: 'settings' },
];
