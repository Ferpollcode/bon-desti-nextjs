const DOMAIN = "bondesti.local";

export function toEmail(usuario: string) {
  return `${usuario.trim().toLowerCase()}@${DOMAIN}`;
}
