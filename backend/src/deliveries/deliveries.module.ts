import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from './entities/delivery.entity';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { ParcelsModule } from '../parcels/parcels.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Delivery]),
        ParcelsModule
    ],
    controllers: [DeliveriesController],
    providers: [DeliveriesService],
    exports: [DeliveriesService],
})
export class DeliveriesModule { }
