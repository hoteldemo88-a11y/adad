import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';
import { success } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

export default async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    const devices = await prisma.childDevice.findMany({
      where: { parentId },
      select: {
        id: true,
        name: true,
        model: true,
        isOnline: true,
        isMonitoringActive: true,
        batteryLevel: true,
        storageTotal: true,
        storageUsed: true,
        lastSyncAt: true,
      },
    });

    const deviceIds = devices.map(d => d.id);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayCalls, todaySms, todayContacts, unreadNotifications] = await Promise.all([
      deviceIds.length > 0
        ? prisma.callLog.groupBy({
            by: ['deviceId', 'type'],
            where: {
              deviceId: { in: deviceIds },
              timestamp: { gte: todayStart, lte: todayEnd },
            },
            _count: true,
          })
        : [],
      deviceIds.length > 0
        ? prisma.smsMessage.groupBy({
            by: ['deviceId', 'type'],
            where: {
              deviceId: { in: deviceIds },
              timestamp: { gte: todayStart, lte: todayEnd },
            },
            _count: true,
          })
        : [],
      deviceIds.length > 0
        ? prisma.contact.count({
            where: { deviceId: { in: deviceIds } },
          })
        : 0,
      prisma.notification.count({
        where: { parentId, isRead: false },
      }),
    ]);

    const deviceStats = devices.map(device => {
      const deviceCalls = todayCalls.filter(c => c.deviceId === device.id);
      const deviceSms = todaySms.filter(s => s.deviceId === device.id);

      const incomingCalls = deviceCalls.find(c => c.type === 'INCOMING')?._count || 0;
      const outgoingCalls = deviceCalls.find(c => c.type === 'OUTGOING')?._count || 0;
      const missedCalls = deviceCalls.find(c => c.type === 'MISSED')?._count || 0;

      const incomingSms = deviceSms.find(s => s.type === 'INCOMING')?._count || 0;
      const outgoingSms = deviceSms.find(s => s.type === 'OUTGOING')?._count || 0;

      return {
        ...device,
        storageTotal: Number(device.storageTotal),
        storageUsed: Number(device.storageUsed),
        storagePercentage: device.storageTotal > 0
          ? Math.round((Number(device.storageUsed) / Number(device.storageTotal)) * 100)
          : 0,
        todayActivity: {
          incomingCalls,
          outgoingCalls,
          missedCalls,
          totalCalls: incomingCalls + outgoingCalls + missedCalls,
          incomingSms,
          outgoingSms,
          totalSms: incomingSms + outgoingSms,
        },
      };
    });

    const totalTodayCalls = todayCalls.reduce((acc, curr) => acc + curr._count, 0);
    const totalTodaySms = todaySms.reduce((acc, curr) => acc + curr._count, 0);

    const onlineDevices = devices.filter(d => d.isOnline).length;
    const offlineDevices = devices.filter(d => !d.isOnline).length;
    const lowBatteryDevices = devices.filter(d => d.batteryLevel <= 20).length;

    const dashboard = {
      devices: deviceStats,
      summary: {
        totalDevices: devices.length,
        onlineDevices,
        offlineDevices,
        lowBatteryDevices,
        totalContacts: todayContacts,
        todayCalls: totalTodayCalls,
        todaySms: totalTodaySms,
        unreadNotifications,
      },
      lastUpdated: new Date().toISOString(),
    };

    return success(reply, dashboard, 'Dashboard data retrieved successfully');
  });
}
