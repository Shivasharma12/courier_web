import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteSegment } from './entities/route-segment.entity';
import { RouteSegmentsService } from './route-segments.service';
import { RouteSegmentsController } from './route-segments.controller';

@Module({
    imports: [TypeOrmModule.forFeature([RouteSegment])],
    controllers: [RouteSegmentsController],
    providers: [RouteSegmentsService],
    exports: [RouteSegmentsService],
})
export class RouteSegmentsModule { }
