# language: es
Característica: Registro de oponentes en un club
Como administrador de club o coach
Quiero registrar a los clubes oponentes contra los que voy a jugar
Para tenerlos en una lista cuando vaya a crear un partido

Esquema del escenario: Administrador de club intenta crear un oponent
Dado que el administrador del club con email "admin_puerto@test.com" y contraseña "PassSegura123!" ha iniciado sesión
Cuando intenta crear al rival "<nombreClub>" ("<aliasClub>") de la ciudad "<ciudadClub>"
Entonces el sistema responde con <estadoCodigo>
Ejemplos: Alta de clubes oponentes
| nombreClub          | aliasClub | ciudadClub         | estadoCodigo |
| Trelew Rugby Club   | TRC       | Trelew             | 201          |
| Bigornia Club       | BCR       | Rawson             | 201          |
| Chenque Rugby Club  | CRC       | Comodoro Rivadavia | 201          |
| Patoruzú Rugby Club | PRC       | Trelew             | 201          |
| Deportivo Portugués | DP        | Comodoro Rivadavia | 201          |
| Calafate Rugby Club | CalRC     | Comodoro Rivadavia | 201          |
| Comodoro Rugby Club | ComRC     | Comodoro Rivadavia | 201          |