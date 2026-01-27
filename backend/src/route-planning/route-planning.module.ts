import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hub } from '../hubs/entities/hub.entity';
import { TransportMode } from '../transport-modes/entities/transport-mode.entity';
import { Parcel } from '../parcels/entities/parcel.entity';
import { User } from '../users/entities/user.entity';
import { RoutePlanningService } from './route-planning.service';
import { RouteMatchingService } from './route-matching.service';
import { RouteSegmentsModule } from '../route-segments/route-segments.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Hub, TransportMode, Parcel, User]),
        RouteSegmentsModule,
    ],
    providers: [RoutePlanningService, RouteMatchingService],
    exports: [RoutePlanningService, RouteMatchingService],
})
export class RoutePlanningModule { }
