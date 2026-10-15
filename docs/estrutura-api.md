# Organização da API

O código da API é agrupado por funcionalidade em `src/modules/`. Serviços de acesso a recursos externos ficam em `src/infraestrutura/`.

| Pasta                             | Classes principais                                                       | Responsabilidade                                           |
| --------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `src/modules/login/`              | `LoginModule`, `LoginController`, `LoginService`                         | Login, emissão de JWT e recuperação/redefinição de senha.  |
| `src/modules/cadastro/`           | `CadastroModule`, `CadastroController`, `CadastroService`                | Cadastro público de contas e proteção da senha com bcrypt. |
| `src/modules/usuarios/`           | `UsuariosModule`, `UsuariosController`, `UsuariosService`                | Consulta, atualização e remoção de usuários existentes.    |
| `src/modules/pontos-recarga/`     | `PontosRecargaModule`, `PontosRecargaController`, `PontosRecargaService` | Cadastro e consulta dos pontos físicos de recarga.         |
| `src/modules/reservas/`           | `ReservasModule`, `ReservasController`, `ReservasService`                | Criação, consulta e cancelamento de reservas.              |
| `src/infraestrutura/banco-dados/` | `PrismaModule`, `PrismaService`                                          | Conexão com PostgreSQL e acesso ao cliente Prisma.         |
| `src/infraestrutura/email/`       | `EmailModule`, `EmailService`                                            | Envio de mensagens por Nodemailer.                         |

`AppModule` registra os módulos da aplicação. `main.ts` configura a inicialização HTTP e a validação global dos DTOs.

## Componentes de cada funcionalidade

- `*.controller.ts`: define rotas e encaminha os dados ao serviço.
- `*.service.ts`: executa regras de negócio e operações de persistência.
- `*.module.ts`: registra controllers, providers e dependências.
- `dto/`: contém as classes que validam dados de entrada.

O cadastro usa `CadastrarUsuarioDto`, em `modules/cadastro/dto/`. O login usa `LoginDto`, em `modules/login/dto/`. Os DTOs de recuperação também pertencem a login. A atualização de usuários usa `AtualizarUsuarioDto`, em `modules/usuarios/dto/`.

`JwtAuthGuard` pertence a `modules/login/guards/` e é exportado pelo `LoginModule`. A interface `RequisicaoAutenticada` fica em `modules/login/interfaces/` e representa o usuário disponibilizado pelo guard. Módulos que protegem rotas com JWT importam `LoginModule`.

## Contratos HTTP

Separar login e cadastro no código não altera as URLs utilizadas pelo aplicativo:

| Operação                   | Rota                                                  | Controller                |
| -------------------------- | ----------------------------------------------------- | ------------------------- |
| Cadastrar conta            | `POST /usuarios`                                      | `CadastroController`      |
| Entrar                     | `POST /auth/login`                                    | `LoginController`         |
| Solicitar recuperação      | `POST /auth/recuperar-senha`                          | `LoginController`         |
| Redefinir senha            | `POST /auth/redefinir-senha`                          | `LoginController`         |
| Consultar/manter usuários  | `GET /usuarios`, `GET/PATCH/DELETE /usuarios/:id`     | `UsuariosController`      |
| Cadastrar/consultar pontos | `POST/GET /pontos-recarga`, `GET /pontos-recarga/:id` | `PontosRecargaController` |
| Gerenciar reservas         | `POST/GET /reservas`, `PATCH /reservas/:id/cancelar`  | `ReservasController`      |

Os controllers de cadastro e usuários compartilham o prefixo `/usuarios`, mas atendem métodos distintos. A separação é de responsabilidade no código. As regras de proteção de rotas existentes foram preservadas nesta reorganização; isso não representa uma revisão completa de autorização.

Consulte os contratos de [login e cadastro](api/login-cadastro.md) e de [reservas](api/reservas.md).

## Testes

- `test/unit/`: testes unitários, agrupados pelo módulo correspondente.
- `test/integration/`: testes de persistência, que exigem `TEST_DATABASE_URL`.
- `test/e2e/`: testes HTTP. Banco e e-mail são substituídos nos testes; os testes de login/cadastro carregam os módulos reais da aplicação.

```bash
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm test -- --runInBand --runTestsByPath test/integration/reservas/reservas.integration.spec.ts
```

## Prisma e configuração

Os modelos continuam em `prisma/schema.prisma` e o histórico em `prisma/migrations/`. O cliente gerado permanece em `src/generated/prisma/` e não deve ser editado manualmente.

A reorganização não adiciona migrations, não muda variáveis de ambiente e não exige migração do banco. `prisma7.config.ts` permanece na raiz. Depois de atualizar os arquivos, gere novamente o cliente e compile:

```bash
npx prisma generate --config prisma7.config.ts
npm run build
```
