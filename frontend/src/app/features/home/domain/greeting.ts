const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

/** "Buen día" hasta las 13, "Buenas tardes" hasta las 20 y "Buenas noches" después. */
export function greetingFor(now: Date): string {
  const hour = now.getHours();
  if (hour < 13) return 'Buen día';
  return hour < 20 ? 'Buenas tardes' : 'Buenas noches';
}

/** "Viernes 6 nov". */
export function hudDateLabel(now: Date): string {
  return `${WEEKDAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}
