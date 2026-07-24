import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

function generateSyncHash(data: string): string {
  return crypto.createHash("md5").update(data).digest("hex");
}

async function main() {
  console.log("Seeding database...");

  // Clean existing data (order matters for foreign keys)
  await prisma.syncState.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.smsMessage.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.session.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.childDevice.deleteMany();
  await prisma.parent.deleteMany();

  console.log("Cleaned existing data.");

  // Create parent user
  const parent = await prisma.parent.create({
    data: {
      email: "parent@example.com",
      passwordHash: hashPassword("Test1234!"),
      name: "John Doe",
      phone: "+1-555-0000",
    },
  });
  console.log(`Created parent: ${parent.email} (ID: ${parent.id})`);

  // Create test child device
  const device = await prisma.childDevice.create({
    data: {
      name: "Samsung Galaxy S24",
      model: "Galaxy S24",
      manufacturer: "Samsung",
      androidVersion: "Android 14",
      pairingCode: "123456",
      parentId: parent.id,
      isOnline: true,
      lastSyncAt: new Date(),
      batteryLevel: 85,
      storageTotal: BigInt(128 * 1024 * 1024 * 1024), // 128 GB
      storageUsed: BigInt(64 * 1024 * 1024 * 1024),    // 64 GB
      isMonitoringActive: true,
    },
  });
  console.log(`Created device: ${device.name} (ID: ${device.id})`);

  // Create sample contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        deviceId: device.id,
        name: "Mom",
        phoneNumber: "+1-555-0101",
        email: "mom@example.com",
        isFavorite: true,
        syncHash: generateSyncHash("Mom+1-555-0101"),
      },
    }),
    prisma.contact.create({
      data: {
        deviceId: device.id,
        name: "Dad",
        phoneNumber: "+1-555-0102",
        email: "dad@example.com",
        isFavorite: true,
        syncHash: generateSyncHash("Dad+1-555-0102"),
      },
    }),
    prisma.contact.create({
      data: {
        deviceId: device.id,
        name: "Unknown Caller",
        phoneNumber: "+1-555-0200",
        isFavorite: false,
        syncHash: generateSyncHash("Unknown Caller+1-555-0200"),
      },
    }),
    prisma.contact.create({
      data: {
        deviceId: device.id,
        name: "Best Friend Alex",
        phoneNumber: "+1-555-0301",
        email: "alex@example.com",
        isFavorite: false,
        syncHash: generateSyncHash("Best Friend Alex+1-555-0301"),
      },
    }),
    prisma.contact.create({
      data: {
        deviceId: device.id,
        name: "School Office",
        phoneNumber: "+1-555-0400",
        isFavorite: false,
        syncHash: generateSyncHash("School Office+1-555-0400"),
      },
    }),
  ]);
  console.log(`Created ${contacts.length} contacts.`);

  // Create sample call logs
  const now = new Date();
  const callLogs = await Promise.all([
    prisma.callLog.create({
      data: {
        deviceId: device.id,
        contactName: "Mom",
        phoneNumber: "+1-555-0101",
        type: "OUTGOING",
        duration: 342,
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        syncHash: generateSyncHash("Mom+1-555-0101+OUTGOING+342"),
      },
    }),
    prisma.callLog.create({
      data: {
        deviceId: device.id,
        contactName: "Dad",
        phoneNumber: "+1-555-0102",
        type: "INCOMING",
        duration: 125,
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        syncHash: generateSyncHash("Dad+1-555-0102+INCOMING+125"),
      },
    }),
    prisma.callLog.create({
      data: {
        deviceId: device.id,
        contactName: "Unknown Caller",
        phoneNumber: "+1-555-0200",
        type: "MISSED",
        duration: 0,
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        syncHash: generateSyncHash("Unknown Caller+1-555-0200+MISSED+0"),
      },
    }),
    prisma.callLog.create({
      data: {
        deviceId: device.id,
        contactName: "Best Friend Alex",
        phoneNumber: "+1-555-0301",
        type: "OUTGOING",
        duration: 890,
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        syncHash: generateSyncHash("Best Friend Alex+1-555-0301+OUTGOING+890"),
      },
    }),
    prisma.callLog.create({
      data: {
        deviceId: device.id,
        phoneNumber: "+1-555-9999",
        type: "INCOMING",
        duration: 45,
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        syncHash: generateSyncHash("+1-555-9999+INCOMING+45"),
      },
    }),
  ]);
  console.log(`Created ${callLogs.length} call logs.`);

  // Create sample SMS messages
  const smsMessages = await Promise.all([
    prisma.smsMessage.create({
      data: {
        deviceId: device.id,
        senderNumber: "+1-555-0101",
        recipientNumber: "+1-555-0000",
        body: "Hi Mom, I'll be home by 5pm today.",
        type: "OUTGOING",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        syncHash: generateSyncHash("OUTGOING+Hi Mom, I'll be home by 5pm today."),
      },
    }),
    prisma.smsMessage.create({
      data: {
        deviceId: device.id,
        senderNumber: "+1-555-0101",
        recipientNumber: "+1-555-0000",
        body: "Ok sweetie, don't forget to pick up milk!",
        type: "INCOMING",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 60000),
        syncHash: generateSyncHash("INCOMING+Ok sweetie, don't forget to pick up milk!"),
      },
    }),
    prisma.smsMessage.create({
      data: {
        deviceId: device.id,
        senderNumber: "+1-555-0301",
        recipientNumber: "+1-555-0000",
        body: "Hey! Want to hang out after school tomorrow?",
        type: "INCOMING",
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        syncHash: generateSyncHash("INCOMING+Hey! Want to hang out after school tomorrow?"),
      },
    }),
    prisma.smsMessage.create({
      data: {
        deviceId: device.id,
        senderNumber: "+1-555-0000",
        recipientNumber: "+1-555-0301",
        body: "Sure! Meet at the usual spot?",
        type: "OUTGOING",
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000 + 120000),
        syncHash: generateSyncHash("OUTGOING+Sure! Meet at the usual spot?"),
      },
    }),
    prisma.smsMessage.create({
      data: {
        deviceId: device.id,
        senderNumber: "+1-555-0400",
        recipientNumber: "+1-555-0000",
        body: "Reminder: Parent-teacher conference is scheduled for next Thursday at 3:30 PM.",
        type: "INCOMING",
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        syncHash: generateSyncHash("INCOMING+Reminder: Parent-teacher conference is scheduled for next Thursday at 3:30 PM."),
      },
    }),
    prisma.smsMessage.create({
      data: {
        deviceId: device.id,
        senderNumber: "+1-555-7777",
        recipientNumber: "+1-555-0000",
        body: "Congratulations! You've won a free gift card. Click here to claim.",
        type: "INCOMING",
        timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000),
        syncHash: generateSyncHash("INCOMING+Congratulations! You've won a free gift card. Click here to claim."),
      },
    }),
  ]);
  console.log(`Created ${smsMessages.length} SMS messages.`);

  console.log("\nSeed completed successfully!");
  console.log("\nTest credentials:");
  console.log("  Parent login: parent@example.com / Test1234!");
  console.log("  Device pairing code: 123456");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
