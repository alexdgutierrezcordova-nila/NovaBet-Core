import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from './shared/ui/header/header';
import { Historial } from './features/historial/historial';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Header, Historial],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
