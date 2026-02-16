import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Handover } from './entities/handover.entity';
import { HandoversService } from './handovers.service';
import { HandoversController } from './handovers.controller';
import { Parcel } from '../parcels/entities/parcel.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Handover, Parcel])],
    providers: [HandoversService],
    controllers: [HandoversController],
    exports: [HandoversService],
})
export class HandoversModule { }
