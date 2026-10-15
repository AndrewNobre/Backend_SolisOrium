# Login e cadastro

Cadastro cria a conta; login valida as credenciais de uma conta existente. As classes de cada fluxo são independentes.

## Cadastro

Implementação em `src/modules/cadastro/`: `CadastroController`, `CadastroService`, `CadastroModule` e `CadastrarUsuarioDto`.

`POST /usuarios`, sem JWT:

```json
{
  "nome": "Motorista",
  "email": "motorista@example.com",
  "senha": "SenhaDeExemplo123",
  "telefone": "92999999999"
}
```

O nome é obrigatório, o e-mail precisa ser válido, a senha precisa ter pelo menos oito caracteres e o telefone deve conter apenas dígitos. Campos extras são rejeitados pela validação global.

Retorna `201` com os dados públicos da conta. A senha é persistida como hash bcrypt e não faz parte da resposta. Dados inválidos retornam `400`; e-mail ou telefone duplicado retorna `409`, conforme o tratamento existente.

## Login

Implementação em `src/modules/login/`: `LoginController`, `LoginService`, `LoginModule` e `LoginDto`.

`POST /auth/login`, sem JWT:

```json
{
  "email": "motorista@example.com",
  "senha": "SenhaDeExemplo123"
}
```

Retorna `201` com `access_token` e `usuario` (id, nome, e-mail e telefone). Credenciais incorretas retornam `401`. O token é apresentado nas rotas protegidas como `Authorization: Bearer <access_token>`.

A recuperação continua no módulo de login:

| Rota                         | Corpo                |
| ---------------------------- | -------------------- |
| `POST /auth/recuperar-senha` | `email`              |
| `POST /auth/redefinir-senha` | `token`, `novaSenha` |

O token de recuperação continua com validade de 15 minutos. A validade da reserva é uma regra independente e permanece em 60 minutos.
