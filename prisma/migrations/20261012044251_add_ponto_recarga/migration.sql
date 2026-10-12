-- CreateEnum
CREATE TYPE "StatusPontoRecarga" AS ENUM ('DISPONIVEL', 'OCUPADO');

-- CreateTable
CREATE TABLE "PontoRecarga" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "latitudeCadastrada" DECIMAL(10,7) NOT NULL,
    "longitudeCadastrada" DECIMAL(10,7) NOT NULL,
    "latitudeDetectada" DECIMAL(10,7),
    "longitudeDetectada" DECIMAL(10,7),
    "status" "StatusPontoRecarga" NOT NULL DEFAULT 'DISPONIVEL',
    "statusAtualizadoEm" TIMESTAMP(3),
    "localizacaoAtualizadaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PontoRecarga_pkey" PRIMARY KEY ("id")
);
