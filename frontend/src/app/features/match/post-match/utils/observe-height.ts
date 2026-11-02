/**
 * Avisa cada vez que cambia el alto de un elemento (al redimensionar la ventana o su contenedor). Devuelve la función
 * que deja de observar. Sin `ResizeObserver` (tests, navegadores viejos) no hace nada.
 */
export function observeHeight(element: HTMLElement, onChange: (height: number) => void): () => void {
  if (typeof ResizeObserver === 'undefined') return () => undefined;
  const observer = new ResizeObserver(() => onChange(element.clientHeight));
  observer.observe(element);
  return () => observer.disconnect();
}
