import "dotenv/config";
import { defineConfig } from "prisma/config";

// Define o schema, as migrations e a conexão usados pelos comandos do Prisma.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
