import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Mercado, MercadoDocument } from '../cuotas/schemas/mercado.schema';

/**
 * Semilla automática de respaldo para el Módulo 2 (Carlos).
 * Si las colecciones `eventos` y `mercados` están vacías (porque el Módulo 1
 * aún no se ha integrado), siembra 4 partidos y sus respectivos mercados 1X2
 * con IDs determinísticos para poder probar POST /api/apuestas de extremo a extremo.
 */
@Injectable()
export class ApuestasSeedService implements OnModuleInit {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Mercado.name)
    private readonly mercadoModel: Model<MercadoDocument>,
  ) {}

  async onModuleInit() {
    const totalMercados = await this.mercadoModel.countDocuments();
    if (totalMercados > 0) {
      return;
    }

    const partidosSemilla = [
      {
        eventoId: new Types.ObjectId('670800000000000000000001'),
        liga: 'UEFA Champions League',
        equipoLocal: 'Real Madrid',
        equipoVisitante: 'Manchester City',
        estado: 'LIVE',
        marcador: { local: 1, visitante: 1 },
        cuotas: { local: 2.1, empate: 3.4, visitante: 3.25 },
      },
      {
        eventoId: new Types.ObjectId('670800000000000000000002'),
        liga: 'La Liga EA Sports',
        equipoLocal: 'Barcelona',
        equipoVisitante: 'Atlético de Madrid',
        estado: 'PRE-MATCH',
        marcador: { local: 0, visitante: 0 },
        cuotas: { local: 1.95, empate: 3.6, visitante: 4.1 },
      },
      {
        eventoId: new Types.ObjectId('670800000000000000000003'),
        liga: 'Premier League',
        equipoLocal: 'Liverpool',
        equipoVisitante: 'Arsenal',
        estado: 'PRE-MATCH',
        marcador: { local: 0, visitante: 0 },
        cuotas: { local: 2.25, empate: 3.2, visitante: 3.05 },
      },
      {
        eventoId: new Types.ObjectId('670800000000000000000004'),
        liga: 'Serie A TIM',
        equipoLocal: 'Inter de Milán',
        equipoVisitante: 'AC Milan',
        estado: 'PRE-MATCH',
        marcador: { local: 0, visitante: 0 },
        cuotas: { local: 2.45, empate: 3.3, visitante: 2.8 },
      },
    ];

    const eventosCollection = this.connection.collection('eventos');
    const totalEventos = await eventosCollection.countDocuments();
    if (totalEventos === 0) {
      await eventosCollection.insertMany(
        partidosSemilla.map((p, idx) => ({
          _id: p.eventoId,
          deporte: 'Fútbol',
          liga: p.liga,
          equipoLocal: p.equipoLocal,
          equipoVisitante: p.equipoVisitante,
          fechaProgramada: new Date(Date.now() + (idx + 1) * 3600 * 1000),
          estado: p.estado,
          marcador: p.marcador,
          resultado: 'SIN_RESULTADO',
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
    }

    await this.mercadoModel.insertMany(
      partidosSemilla.map((p) => ({
        eventoId: p.eventoId,
        tipo: '1X2',
        estadoMercado: 'ABIERTO',
        cuotas: p.cuotas,
        cuotasVersion: 1,
        margen: 0.06,
      })),
    );

    console.log(
      '✅ [Seed M2]: 4 eventos y 4 mercados 1X2 iniciales sembrados para pruebas de Apuestas.',
    );
  }
}
