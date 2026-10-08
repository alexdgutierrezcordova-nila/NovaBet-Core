import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BetslipService } from '../../../domains/apuestas/betslip.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header {
  private readonly betslipService = inject(BetslipService);
  readonly saldo = this.betslipService.saldoUsuario;

  recargar() {
    this.betslipService.recargarSaldo(500);
  }
}
