import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

// Disponibiliza o serviço de e-mail para outros módulos, como AuthModule.
@Module({
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }