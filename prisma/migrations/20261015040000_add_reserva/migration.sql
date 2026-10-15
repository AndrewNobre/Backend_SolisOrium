-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('ATIVA', 'CANCELADA', 'EXPIRADA');

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "pontoRecargaId" TEXT NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'ATIVA',
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "canceladaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reserva_usuarioId_createdAt_idx" ON "Reserva"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "Reserva_pontoRecargaId_status_expiraEm_idx" ON "Reserva"("pontoRecargaId", "status", "expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_ponto_ativo_key" ON "Reserva"("pontoRecargaId") WHERE ("status" = 'ATIVA');

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_pontoRecargaId_fkey" FOREIGN KEY ("pontoRecargaId") REFERENCES "PontoRecarga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

