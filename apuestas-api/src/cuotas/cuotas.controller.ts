import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CuotasService } from './cuotas.service';

@Controller('cuotas')
export class CuotasController {
  constructor(private readonly cuotasService: CuotasService) {}

  /**
   * Endpoint SSE (Server-Sent Events) para fluctuación de cuotas en tiempo real.
   * Conexión consumida por el frontend Angular en GET /api/cuotas/stream.
   */
  @Sse('stream')
  obtenerStream(): Observable<MessageEvent> {
    return this.cuotasService.obtenerStream();
  }
}
