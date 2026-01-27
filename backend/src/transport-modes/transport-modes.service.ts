import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransportMode, TransportType } from './entities/transport-mode.entity';
import { CreateTransportModeDto } from './dto/create-transport-mode.dto';

@Injectable()
export class TransportModesService {
    constructor(
        @InjectRepository(TransportMode)
        private transportModeRepository: Repository<TransportMode>,
    ) { }

    async create(createDto: CreateTransportModeDto): Promise<TransportMode> {
        const transportMode = this.transportModeRepository.create(createDto);
        return this.transportModeRepository.save(transportMode);
    }

    async findAll(): Promise<TransportMode[]> {
        return this.transportModeRepository.find({
            where: { isActive: true },
        });
    }

    async findOne(id: string): Promise<TransportMode | null> {
        return this.transportModeRepository.findOne({ where: { id } });
    }

    async findByType(type: TransportType): Promise<TransportMode | null> {
        return this.transportModeRepository.findOne({ where: { type } });
    }

    async seedDefaultModes(): Promise<void> {
        const modes = [
            {
                type: TransportType.BIKE,
                name: 'Motorcycle/Bike',
                description: 'Fast delivery for small parcels within city',
                maxWeight: 20,
                maxVolume: 0.1,
                avgSpeed: 40,
                costPerKm: 5,
                isActive: true,
            },
            {
                type: TransportType.VAN,
                name: 'Delivery Van',
                description: 'Medium-sized parcels, local and intercity',
                maxWeight: 500,
                maxVolume: 5,
                avgSpeed: 60,
                costPerKm: 10,
                isActive: true,
            },
            {
                type: TransportType.TRUCK,
                name: 'Cargo Truck',
                description: 'Large and heavy parcels, long distance',
                maxWeight: 5000,
                maxVolume: 30,
                avgSpeed: 70,
                costPerKm: 15,
                isActive: true,
            },
            {
                type: TransportType.AIR,
                name: 'Air Freight',
                description: 'Express delivery, domestic and international',
                maxWeight: 10000,
                maxVolume: 100,
                avgSpeed: 500,
                costPerKm: 50,
                isActive: true,
            },
            {
                type: TransportType.TRAIN,
                name: 'Rail Transport',
                description: 'Cost-effective for bulk and long-distance',
                maxWeight: 20000,
                maxVolume: 200,
                avgSpeed: 80,
                costPerKm: 8,
                isActive: true,
            },
        ];

        for (const mode of modes) {
            const existing = await this.findByType(mode.type);
            if (!existing) {
                await this.create(mode);
            }
        }
    }
}
