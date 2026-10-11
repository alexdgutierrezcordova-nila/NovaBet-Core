import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Betslip } from './features/betslip/betslip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Betslip],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
