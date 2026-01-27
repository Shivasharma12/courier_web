import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportMode } from './entities/transport-mode.entity';
import { TransportModesService } from './transport-modes.service';
import { TransportModesController } from './transport-modes.controller';

@Module({
    imports: [TypeOrmModule.forFeature([TransportMode])],
    controllers: [TransportModesController],
    providers: [TransportModesService],
    exports: [TransportModesService],
})
export class TransportModesModule { }
