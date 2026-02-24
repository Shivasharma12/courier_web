import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hub } from './entities/hub.entity';

import { HubUpdate } from './entities/hub-update.entity';

@Injectable()
export class HubsService {
    constructor(
        @InjectRepository(Hub)
        private hubsRepository: Repository<Hub>,
        @InjectRepository(HubUpdate)
        private hubUpdatesRepository: Repository<HubUpdate>,
    ) { }

    findAll() {
        return this.hubsRepository.find();
    }

    async findOne(id: string) {
        return this.hubsRepository.findOne({ where: { id } });
    }

    async findNearbyHub(lat: number, lng: number) {
        const hubs = await this.findAll();
        if (hubs.length === 0) return null;

        // Simple distance calculation (Haversine or similar simplified)
        const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const hubsWithDistance = hubs.map(hub => ({
            ...hub,
            distance: calculateDistance(lat, lng, hub.lat, hub.lng)
        })).sort((a, b) => a.distance - b.distance);

        return hubsWithDistance[0];
    }

    async getStats(hubId: string) {
        const hub = await this.findOne(hubId);
        if (!hub) return null;

        // Fetch pending requests for this hub
        const pendingRequests = await this.hubUpdatesRepository.find({
            where: { hubId, status: 'pending' }
        });

        return {
            ...hub,
            inventory: hub.currentLoad || 0,
            capacity: hub.capacity || 1000,
            earnings: hub.totalEarnings || 0,
            incoming: 12, // Mocked for now
            outgoing: 8,  // Mocked for now
            hasPendingUpdates: pendingRequests.length > 0,
            pendingUpdates: pendingRequests
        };
    }

    async create(hubData: Partial<Hub>) {
        const hub = this.hubsRepository.create(hubData);
        return this.hubsRepository.save(hub);
    }

    async createForManager(hubData: Partial<Hub>, userId: string) {
        // Create the hub with 'pending' status - requires admin approval
        const hub = await this.create({ ...hubData, status: 'pending' });
        return hub;
    }

    async findPending() {
        return this.hubsRepository.find({ where: { status: 'pending' } });
    }

    async approveHub(hubId: string) {
        await this.hubsRepository.update(hubId, { status: 'active', rejectionReason: undefined });
        return this.findOne(hubId);
    }

    async rejectHub(hubId: string, reason: string) {
        await this.hubsRepository.update(hubId, { status: 'rejected', rejectionReason: reason });
        return this.findOne(hubId);
    }

    async updateHubMedia(hubId: string, shopPhoto?: string, documentUrls?: string[]) {
        const updateData: Partial<Hub> = {};
        if (shopPhoto) updateData.shopPhoto = shopPhoto;
        if (documentUrls) updateData.documentUrls = JSON.stringify(documentUrls);
        await this.hubsRepository.update(hubId, updateData);
        return this.findOne(hubId);
    }

    /** Reset hub back to 'pending' so admin must re-review it */
    async setStatusPending(hubId: string) {
        await this.hubsRepository.update(hubId, { status: 'pending', rejectionReason: undefined });
        return this.findOne(hubId);
    }

    async update(id: string, hubData: Partial<Hub>) {
        await this.hubsRepository.update(id, hubData);
        return this.findOne(id);
    }

    // --- Hub Requests (Approval Flow) ---

    async submitHubRequest(hubId: string, managerId: string, data: any) {
        // Create a new update request
        const request = this.hubUpdatesRepository.create({
            hubId,
            managerId,
            requestedData: data,
            status: 'pending'
        });
        return this.hubUpdatesRepository.save(request);
    }

    async getAllHubRequests() {
        return this.hubUpdatesRepository.find({
            relations: ['hub', 'manager'],
            order: { createdAt: 'DESC' }
        });
    }

    async getHubRequestsByStatus(status: string) {
        return this.hubUpdatesRepository.find({
            where: { status },
            relations: ['hub', 'manager'],
            order: { createdAt: 'DESC' }
        });
    }

    async getLatestRequestForHub(hubId: string) {
        return this.hubUpdatesRepository.findOne({
            where: { hubId },
            order: { createdAt: 'DESC' }
        });
    }

    async approveHubRequest(requestId: string, adminComment?: string) {
        const request = await this.hubUpdatesRepository.findOne({ where: { id: requestId } });
        if (!request) throw new Error('Request not found');

        // 1. Update the actual Hub
        await this.hubsRepository.update(request.hubId, request.requestedData);

        // 2. Mark request as approved
        request.status = 'approved';
        request.adminComment = adminComment || '';
        return this.hubUpdatesRepository.save(request);
    }

    async rejectHubRequest(requestId: string, adminComment: string) {
        const request = await this.hubUpdatesRepository.findOne({ where: { id: requestId } });
        if (!request) throw new Error('Request not found');

        request.status = 'rejected';
        request.adminComment = adminComment;
        return this.hubUpdatesRepository.save(request);
    }

    remove(id: string) {
        return this.hubsRepository.delete(id);
    }
}
