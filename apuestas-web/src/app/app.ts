import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from './shared/ui/header/header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
