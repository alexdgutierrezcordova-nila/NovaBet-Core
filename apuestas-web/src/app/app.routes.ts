import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/cartelera/cartelera').then((m) => m.Cartelera),
  },
  {
    path: 'betslip',
    loadComponent: () =>
      import('./features/betslip/betslip').then((m) => m.Betslip),
  },
];
