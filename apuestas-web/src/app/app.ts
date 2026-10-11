import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Betslip } from './features/betslip/betslip';
import { Cartelera } from './features/cartelera/cartelera';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Betslip, Cartelera],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
