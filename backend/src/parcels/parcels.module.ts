import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parcel } from './entities/parcel.entity';
import { ParcelsService } from './parcels.service';
import { ParcelsController } from './parcels.controller';
import { MatchingService } from './matching.service';
import { User } from '../users/entities/user.entity';
import { RoutePlanningModule } from '../route-planning/route-planning.module';
import { TravelPlansModule } from '../travel-plans/travel-plans.module';

import { TrackingModule } from '../tracking/tracking.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Parcel, User]),
        RoutePlanningModule,
        TravelPlansModule,
        TrackingModule,
    ],
    controllers: [ParcelsController],
    providers: [ParcelsService, MatchingService],
    exports: [ParcelsService, MatchingService],
})
export class ParcelsModule { }
