import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hub } from './entities/hub.entity';
import { HubsService } from './hubs.service';
import { HubsController } from './hubs.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Hub])],
    controllers: [HubsController],
    providers: [HubsService],
    exports: [HubsService],
})
export class HubsModule { }
