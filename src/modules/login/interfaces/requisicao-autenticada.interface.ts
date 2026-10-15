/** Representa a identidade disponibilizada pelo guard JWT na requisição HTTP. */
export interface RequisicaoAutenticada {
  headers: { authorization?: string };
  user: { sub: string };
}
