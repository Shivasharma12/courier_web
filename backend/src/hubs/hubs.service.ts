import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hub } from './entities/hub.entity';

@Injectable()
export class HubsService {
    constructor(
        @InjectRepository(Hub)
        private hubsRepository: Repository<Hub>,
    ) { }

    findAll() {
        return this.hubsRepository.find();
    }

    async findOne(id: string) {
        return this.hubsRepository.findOne({ where: { id } });
    }

    async getStats(hubId: string) {
        const hub = await this.findOne(hubId);
        if (!hub) return null;

        // In a real app, we'd query parcels for incoming/outgoing
        // For now, we return hub details and some mock/calculated counters
        return {
            ...hub,
            inventory: hub.currentLoad || 0,
            capacity: hub.capacity || 1000,
            earnings: hub.totalEarnings || 0,
            incoming: 12, // Mocked for now
            outgoing: 8,  // Mocked for now
        };
    }

    create(hubData: Partial<Hub>) {
        const hub = this.hubsRepository.create(hubData);
        return this.hubsRepository.save(hub);
    }

    async update(id: string, hubData: Partial<Hub>) {
        await this.hubsRepository.update(id, hubData);
        return this.findOne(id);
    }

    remove(id: string) {
        return this.hubsRepository.delete(id);
    }
}
