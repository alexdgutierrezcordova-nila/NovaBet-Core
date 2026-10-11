import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'betslip',
    loadComponent: () =>
      import('./features/betslip/betslip').then((m) => m.Betslip),
  },
];
