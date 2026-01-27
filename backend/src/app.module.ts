import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { Hub } from './hubs/entities/hub.entity';
import { Parcel } from './parcels/entities/parcel.entity';
import { Delivery } from './deliveries/entities/delivery.entity';
import { TrackingLog } from './tracking/entities/tracking-log.entity';
import { TransportMode } from './transport-modes/entities/transport-mode.entity';
import { RouteSegment } from './route-segments/entities/route-segment.entity';
import { TravelPlan } from './travel-plans/entities/travel-plan.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HubsModule } from './hubs/hubs.module';
import { ParcelsModule } from './parcels/parcels.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { TrackingModule } from './tracking/tracking.module';
import { TransportModesModule } from './transport-modes/transport-modes.module';
import { RouteSegmentsModule } from './route-segments/route-segments.module';
import { RoutePlanningModule } from './route-planning/route-planning.module';
import { TravelPlansModule } from './travel-plans/travel-plans.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Shiva@123',
      database: 'courier_db',
      entities: [User, Hub, Parcel, Delivery, TrackingLog, TransportMode, RouteSegment, TravelPlan],
      synchronize: true, // Set to false in production
    }),
    AuthModule,
    UsersModule,
    HubsModule,
    ParcelsModule,
    DeliveriesModule,
    TrackingModule,
    TransportModesModule,
    RouteSegmentsModule,
    RoutePlanningModule,
    TravelPlansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

