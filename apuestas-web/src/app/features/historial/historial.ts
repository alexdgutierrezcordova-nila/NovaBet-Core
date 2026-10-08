import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BetslipService } from '../../domains/apuestas/betslip.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.html',
  styleUrls: ['./historial.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Historial {
  private readonly betslipService = inject(BetslipService);
  readonly tickets = this.betslipService.historialTickets;
}
