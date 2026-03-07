import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { Hub } from './hubs/entities/hub.entity';
import { Parcel } from './parcels/entities/parcel.entity';
import { ParcelLeg } from './parcels/entities/parcel-leg.entity';
import { Delivery } from './deliveries/entities/delivery.entity';
import { TrackingLog } from './tracking/entities/tracking-log.entity';
import { TransportMode } from './transport-modes/entities/transport-mode.entity';
import { RouteSegment } from './route-segments/entities/route-segment.entity';
import { TravelPlan } from './travel-plans/entities/travel-plan.entity';
import { Handover } from './handovers/entities/handover.entity';
import { HubUpdate } from './hubs/entities/hub-update.entity';
import { Notification } from './common/entities/notification.entity';
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
import { HandoversModule } from './handovers/handovers.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url: url,
          host: url ? undefined : config.get<string>('DB_HOST', 'localhost'),
          port: url ? undefined : config.get<number>('DB_PORT', 5432),
          username: url ? undefined : config.get<string>('DB_USERNAME', 'postgres'),
          password: url ? undefined : config.get<string>('DB_PASSWORD', 'Shiva@123'),
          database: url ? undefined : config.get<string>('DB_DATABASE', 'courier_db'),
          entities: [User, Hub, HubUpdate, Parcel, ParcelLeg, Delivery, TrackingLog, TransportMode, RouteSegment, TravelPlan, Handover, Notification],
          synchronize: true, // Set to false in production
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    ScheduleModule.forRoot(),
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
    HandoversModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

