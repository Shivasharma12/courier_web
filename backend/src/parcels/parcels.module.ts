import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parcel } from './entities/parcel.entity';
import { ParcelLeg } from './entities/parcel-leg.entity';
import { ParcelsService } from './parcels.service';
import { ParcelsController } from './parcels.controller';
import { MatchingService } from './matching.service';
import { ParcelExpiryScheduler } from './parcel-expiry.scheduler';
import { User } from '../users/entities/user.entity';
import { RoutePlanningModule } from '../route-planning/route-planning.module';
import { TravelPlansModule } from '../travel-plans/travel-plans.module';
import { UsersModule } from '../users/users.module';
import { TrackingModule } from '../tracking/tracking.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Parcel, ParcelLeg, User]),
        RoutePlanningModule,
        TravelPlansModule,
        TrackingModule,
        UsersModule,
        NotificationsModule,
    ],
    controllers: [ParcelsController],
    providers: [ParcelsService, MatchingService, ParcelExpiryScheduler],
    exports: [ParcelsService, MatchingService],
})
export class ParcelsModule { }

