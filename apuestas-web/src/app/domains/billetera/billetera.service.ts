import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Billetera } from './billetera.model';
import { API_BASE_URL } from '../api.config';

/**
 * @class BilleteraService
 * @description Servicio Angular de Dominio para la Billetera Virtual y Gestión de Saldo.
 * 
 * ARQUITECTURA:
 * - Domain-First (Ley Fundamental): Es la ÚNICA fuente de acceso a datos HTTP
 *   para la entidad Billetera. Los componentes nunca llaman a HttpClient directamente.
 * - Inyección Moderna: Emplea la función `inject()` de Angular en lugar de constructores.
 * - Estándar Zero-Floats: Toda comunicación de saldo se realiza en centavos enteros (int).
 */
@Injectable({
  providedIn: 'root'
})
export class BilleteraService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/billetera`;

  /**
   * Consulta el balance actual y estado de bloqueo de la billetera.
   * 
   * @param usuarioId ID del usuario (por defecto 'usr-demo')
   * @returns Observable con los datos de la Billetera (saldoCentavos, bloqueada)
   */
  obtenerBalance(usuarioId = 'usr-demo'): Observable<Billetera> {
    return this.http.get<Billetera>(`${this.apiUrl}/balance`, {
      params: { usuarioId }
    });
  }

  /**
   * Realiza una recarga virtual de fondos en centavos enteros.
   * 
   * @param montoCentavos Monto en centavos enteros (ej: 50000 = $500.00 USD)
   * @param usuarioId ID del usuario (por defecto 'usr-demo')
   * @returns Observable con la Billetera actualizada tras el asiento en el Ledger
   */
  recargarSaldo(montoCentavos = 50000, usuarioId = 'usr-demo'): Observable<Billetera> {
    return this.http.post<Billetera>(`${this.apiUrl}/recargar`, {
      montoCentavos,
      usuarioId
    });
  }
}
