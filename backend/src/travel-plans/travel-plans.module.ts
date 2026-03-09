import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TravelPlansController } from './travel-plans.controller';
import { TravelPlansService } from './travel-plans.service';
import { TravelMatchingService } from './travel-matching.service';
import { TravelPlan } from './entities/travel-plan.entity';
import { Parcel } from '../parcels/entities/parcel.entity';

import { TrackingModule } from '../tracking/tracking.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TravelPlan, Parcel]),
    TrackingModule,
    NotificationsModule,
  ],
  controllers: [TravelPlansController],
  providers: [TravelPlansService, TravelMatchingService],
  exports: [TravelMatchingService]
})
export class TravelPlansModule { }
