# Reservas — MVP

Uma reserva é uma retenção imediata de um ponto de recarga por **60 minutos**. Não há agendamento de horários futuros nesta versão. A duração é definida pelo servidor em `src/modules/reservas/reservas.service.ts`; o cliente não envia usuário, status ou expiração.

## Regras

- Todas as rotas exigem `Authorization: Bearer <access_token>`.
- O proprietário é o `sub` do JWT. O guard valida esse campo e disponibiliza `request.user.sub`.
- Só é possível reservar um ponto existente com status físico `DISPONIVEL`.
- Cada ponto admite apenas uma reserva `ATIVA`. Um usuário pode reservar pontos diferentes nesta versão.
- Estados: `ATIVA`, `CANCELADA` e `EXPIRADA`.
- A reserva deixa de valer quando `expiraEm <= agora`, mesmo sem um processo agendado.
- A listagem apresenta reservas vencidas como `EXPIRADA`. Ao reservar novamente o ponto, o banco também atualiza o estado das reservas vencidas dentro da transação.
- Só o proprietário pode cancelar uma reserva ativa dentro do prazo. Tentativas de acessar reservas alheias recebem o mesmo `404` de uma reserva inexistente.
- Cancelar libera imediatamente o ponto para nova reserva. Não há exclusão do histórico pelo endpoint de cancelamento.
- Criar uma reserva não altera `PontoRecarga.status`: `DISPONIVEL`/`OCUPADO` representa ocupação física. Os endpoints existentes de pontos ainda não expõem disponibilidade considerando reservas; o aplicativo deve tratar o `409` ao tentar reservar. Uma projeção de disponibilidade para o mapa é uma próxima melhoria.
- Esta versão não inicia recarga, não confirma chegada e não integra sensores ou MQTT.

## Endpoints

### `POST /reservas`

Corpo:

```json
{ "pontoRecargaId": "0fc2cf04-5b2f-4e86-8703-4654359db181" }
```

Resposta `201` (exemplo):

```json
{
  "id": "b98c2b9c-cd0f-4503-bb53-d95cc70268df",
  "usuarioId": "94e27936-592e-4a06-8fa3-4fc4c3825443",
  "pontoRecargaId": "0fc2cf04-5b2f-4e86-8703-4654359db181",
  "status": "ATIVA",
  "expiraEm": "2026-10-15T05:00:00.000Z",
  "canceladaEm": null,
  "createdAt": "2026-10-15T04:00:00.000Z",
  "updatedAt": "2026-10-15T04:00:00.000Z"
}
```

### `GET /reservas`

Retorna `200` com um array contendo somente as reservas do usuário autenticado, da mais recente para a mais antiga. Inclui histórico cancelado e expirado; sem reservas, retorna `[]`.

### `PATCH /reservas/:id/cancelar`

Não exige corpo. Retorna `200` com a reserva atualizada, `status: "CANCELADA"` e `canceladaEm` preenchido.

### Erros

| Código | Situação                                                                       |
| ------ | ------------------------------------------------------------------------------ |
| `400`  | Corpo inválido, UUID inválido ou campo extra no cadastro da reserva.           |
| `401`  | JWT ausente, inválido, expirado ou sem `sub`; na criação, conta removida.      |
| `404`  | Ponto inexistente, reserva inexistente ou reserva pertencente a outro usuário. |
| `409`  | Ponto ocupado/reservado, reserva já cancelada ou prazo vencido ao cancelar.    |

Datas são devolvidas em ISO 8601. O relógio do servidor determina a expiração.

## Concorrência e persistência

`criar` executa uma transação que bloqueia a linha do ponto com `SELECT ... FOR UPDATE`, expira a reserva anterior vencida, verifica conflito e cria a nova reserva. O bloqueio serializa requisições para o mesmo ponto inclusive em processos distintos. A transação utiliza o isolamento padrão do PostgreSQL (`READ COMMITTED`).

Um índice único parcial (`Reserva_ponto_ativo_key`) fornece uma segunda proteção no banco para `status = 'ATIVA'`. Ele está declarado no schema usando `partialIndexes`, recurso preview disponível no Prisma 7.10 já utilizado pelo projeto. Preservar essa configuração ao gerar novas migrations. A expiração por tempo é verificada pelo serviço, pois um índice por status não elimina registros vencidos automaticamente.

O cancelamento usa atualização condicional por proprietário, status e prazo: somente uma tentativa concorrente pode alterar uma reserva ativa.

## Aplicar em um ambiente local

Depois de integrar a branch e configurar o `.env` local, sem compartilhar seus valores:

```bash
npm ci
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
npm run build
npm run start:dev
```

A migration nova é `20261015040000_add_reserva`. Não modifica migrations anteriores nem exige reset. Aplicar primeiro em um banco de desenvolvimento. Nenhuma migration é executada automaticamente ao iniciar o NestJS.

## Testes

```bash
# Suíte unitária; integração fica ignorada sem TEST_DATABASE_URL
npm test -- --runInBand

# HTTP com JWT real e serviço substituído, sem banco ou Gmail
npm run test:e2e -- --runInBand --testPathPatterns=reservas

# Schema, build e lint
npx prisma validate --config prisma7.config.ts
npm run build
npm run lint
```

Para integração, configurar `TEST_DATABASE_URL` no ambiente apontando para um PostgreSQL de testes e executar:

```bash
npm test -- --runInBand --runTestsByPath test/integration/reservas/reservas.integration.spec.ts
```

Essa suíte aplica todas as migrations em um schema aleatório `test_reservas_*` e remove somente esse schema ao final. Não usa `DATABASE_URL`, não faz reset e exige permissão para criar schemas. Sem `TEST_DATABASE_URL`, seus seis testes ficam ignorados. Não versionar credenciais.

A suíte verifica criação concorrente, índice único, expiração e nova reserva, isolamento por proprietário, cancelamento concorrente, ponto ocupado e ponto inexistente. Para validar bloqueios concorrentes, executá-la em PostgreSQL com o pool padrão de dez conexões; `TEST_POOL_MAX=1` serializa as operações e não valida disputa real de bloqueios.
