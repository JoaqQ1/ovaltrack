/** Iniciales del avatar: nombre y apellido; si no hay, las dos primeras letras del correo. */
export function getUserInitials(fullName: string, email: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const looksLikeEmail = words.length === 1 && words[0] === email;
  if (words.length > 0 && !looksLikeEmail) {
    const first = words[0][0];
    const last = words.length > 1 ? words[words.length - 1][0] : (words[0][1] ?? '');
    return `${first}${last}`.toUpperCase();
  }
  const local = email.split('@')[0] ?? '';
  return (local.slice(0, 2) || '?').toUpperCase();
}
