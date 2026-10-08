# 📋 Especificación de Requisitos del Sistema — NovaBet

## 1. Tabla de Requisitos Funcionales (RF)

| Código | Requisito | Módulo / Responsable | Descripción | Criterio de Aceptación | Prioridad |
|---|---|---|---|---|:---:|
| **RF01** | Catálogo de Eventos Deportivos | **Módulo 1**<br/>(Integrante 1) | El sistema debe almacenar y listar partidos con deporte, liga, equipos y cuotas decimales 1X2 (Local, Empate, Visitante). | Se visualizan al menos 4 partidos activos ordenados por fecha al cargar la aplicación. | Alta |
| **RF02** | Simulación de Resultados | **Módulo 1**<br/>(Integrante 1) | El sistema debe permitir registrar el resultado final de un partido (`LOCAL`, `EMPATE`, `VISITANTE`) y su marcador final. | El estado del evento cambia a `FINALIZADO` y se dispara la liquidación de tickets correspondientes. | Media |
| **RF03** | Cálculo Reactivo de Ganancia | **Módulo 2**<br/>(Integrante 2) | El sistema debe calcular en tiempo real la ganancia potencial multiplicando el monto ingresado por la cuota seleccionada ($\text{Monto} \times \text{Cuota}$). | La ganancia potencial se actualiza en $< 50\text{ ms}$ en el cupón al modificar el monto o cambiar de cuota mediante Angular Signals. | Alta |
| **RF04** | Emisión y Validación de Ticket | **Módulo 2**<br/>(Integrante 2) | El sistema debe verificar que el monto sea $> 0$, validar fondos suficientes y generar un boleto único en estado `PENDIENTE`. | Si el monto es válido y hay saldo, se emite el ticket con ID único y la cuota queda congelada. Si falta saldo, muestra alerta de error. | Alta |
| **RF05** | Monedero y Recarga Virtual | **Módulo 3**<br/>(Integrante 3) | El sistema debe proveer una cuenta ficticia (`usr-demo`) con saldo inicial (\$1,000.00 USD) y permitir recargar saldo mediante un botón rápido. | Al hacer clic en recargar, se acreditan \$500 ficticios inmediatamente en la base de datos y se actualiza el saldo visual del header. | Alta |
| **RF06** | Débito y Liquidación de Premios | **Módulo 3**<br/>(Integrante 3) | El sistema debe debitar el monto al apostar y acreditar las ganancias al saldo del usuario si el ticket resulta ganador. | Al resolverse un partido, los tickets ganadores suman su retorno al saldo y cambian de estado de `PENDIENTE` a `GANADA`. | Alta |
| **RF07** | Historial y Estado de Apuestas | **Módulo 3**<br/>(Integrante 3) | El sistema debe mostrar el listado de tickets apostados indicando partido, selección, monto, ganancia y estado visual. | Cada ticket muestra su badge de color según su estado: `PENDIENTE` (amarillo), `GANADA` (verde) o `PERDIDA` (rojo). | Media |

---

## 2. Tabla de Requisitos No Funcionales (RNF)

| Código | Categoría | Descripción | Métrica / Criterio de Cumplimiento |
|---|---|---|---|
| **RNF01** | **Usabilidad / UI** | Interfaz moderna con estética Dark Mode basada en variables CSS centralizadas. | Paleta compartida en `:root` (`styles.scss`): fondo `#0b0e14`, superficie `#151c28` y acento verde `#00e676`. |
| **RNF02** | **Diseño Responsivo** | Adaptabilidad a pantallas de escritorio y dispositivos móviles o tablets. | Grid fluido con breakpoint en `1024px`: en pantallas menores, la barra lateral pasa a posicionarse debajo de la cartelera. |
| **RNF03** | **Rendimiento** | Reactividad inmediata en el cálculo del cupón sin recargar la página. | Uso de Angular Signals para actualización en $< 50\text{ ms}$ de la ganancia potencial en el cliente. |
| **RNF04** | **Integridad Financiera** | Prevención de saldo negativo e inmutabilidad de cuotas tras apostar. | El backend rechaza cualquier apuesta con monto mayor al saldo disponible (HTTP 400); la cuota del ticket no cambia tras emitirse. |
| **RNF05** | **Arquitectura y Modularidad** | Separación por Módulos Verticales de Negocio respetando las 3 capas (Persistencia, Negocio, Presentación). | Backend modular en NestJS 11 con controladores y servicios desacoplados; frontend en Angular 22 con componentes independientes. |
| **RNF06** | **Persistencia y Resiliencia** | Base de datos documental con auto-población de datos iniciales en el arranque. | MongoDB mediante Mongoose 8 con seeder automático que inserta partidos y usuario inicial si la BD está vacía. |
| **RNF07** | **Manejo de Errores y Feedback** | Notificación clara al usuario ante fallos de validación o fondos insuficientes. | Respuestas HTTP estándar (400, 404, 500) mapeadas a mensajes legibles en la interfaz de usuario. |
| **RNF08** | **Trazabilidad en Git** | Registro claro del trabajo en Git mediante ramas independientes por módulo. | 3 ramas de feature (`feature/modulo-eventos`, `feature/modulo-betslip`, `feature/modulo-billetera-usuario`) vinculadas a sus respectivos Issues. |
