import { Module } from '@nestjs/common';
import { RecargaController } from './recarga.controller';
import { RecargaService } from './recarga.service';
import { AuthModule } from '../auth/auth.module';

// Agrupa as rotas e regras de negócio dos pontos de recarga.
@Module({
    imports: [AuthModule],
    controllers: [RecargaController],
    providers: [RecargaService],
})
export class RecargaModule { }