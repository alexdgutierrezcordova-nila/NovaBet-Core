export interface Usuario {
  _id: string;                    // MongoDB ObjectId serializado como string
  usuarioId: string;              // Siempre 'usr-demo' para este MVP
  nombre: string;
  email: string;
  saldo: number;
}
