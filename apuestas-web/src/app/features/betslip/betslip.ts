import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BetslipService } from '../../domains/apuestas/betslip.service';

@Component({
  selector: 'app-betslip',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './betslip.html',
  styleUrls: ['./betslip.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Betslip {
  private readonly betslipService = inject(BetslipService);

  readonly seleccion = this.betslipService.seleccion;
  readonly montoApostado = this.betslipService.montoApostado;
  readonly gananciaPotencial = this.betslipService.gananciaPotencial;
  readonly saldoUsuario = this.betslipService.saldoUsuario;

  mensajeAlerta: string = '';
  tipoAlerta: 'exito' | 'error' | '' = '';

  onMontoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const valor = parseFloat(input.value) || 0;
    this.betslipService.setMonto(valor);
  }

  limpiar() {
    this.betslipService.limpiarSeleccion();
    this.mensajeAlerta = '';
  }

  apostar() {
    const res = this.betslipService.colocarApuesta();
    this.mensajeAlerta = res.mensaje;
    this.tipoAlerta = res.exito ? 'exito' : 'error';

    if (res.exito) {
      setTimeout(() => {
        this.mensajeAlerta = '';
      }, 4000);
    }
  }
}
