import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/betslip/betslip').then((m) => m.Betslip),
  },
  {
    path: 'betslip',
    loadComponent: () =>
      import('./features/betslip/betslip').then((m) => m.Betslip),
  },
];
