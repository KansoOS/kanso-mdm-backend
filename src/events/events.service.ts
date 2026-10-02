import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const allowedEventTypes = new Set([
  'parcours.abandonne',
  'guidage.termine',
  'niveau.propose',
  'contact.en_validation',
  'demande.creee',
  'politique.appliquee',
  'mandat.revoque',
]);

export type IncomingDeviceEvent = {
  eventId: string;
  type: string;
  occurredAt: string;
  policyVersion?: number;
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async ingest(deviceId: string, events: IncomingDeviceEvent[]) {
    if (!Array.isArray(events) || events.length === 0) {
      throw new BadRequestException('events must be a non-empty array');
    }

    if (events.length > 100) {
      throw new BadRequestException('A batch cannot contain more than 100 events');
    }

    const accepted: IncomingDeviceEvent[] = [];
    const rejected: string[] = [];

    for (const event of events) {
      if (
        typeof event?.eventId !== 'string' ||
        event.eventId.length < 1 ||
        event.eventId.length > 128 ||
        typeof event.type !== 'string' ||
        !allowedEventTypes.has(event.type) ||
        typeof event.occurredAt !== 'string' ||
        Number.isNaN(Date.parse(event.occurredAt)) ||
        (event.policyVersion !== undefined &&
          (!Number.isInteger(event.policyVersion) || event.policyVersion < 0))
      ) {
        if (typeof event?.eventId === 'string' && event.eventId.length > 0) {
          rejected.push(event.eventId);
        }
        continue;
      }

      accepted.push(event);
    }

    if (accepted.length > 0) {
      await this.prisma.deviceEvent.createMany({
        data: accepted.map((event) => ({
          eventId: event.eventId,
          deviceId,
          type: event.type,
          occurredAt: new Date(event.occurredAt),
          policyVersion: event.policyVersion ?? null,
        })),
        skipDuplicates: true,
      });

      const appliedVersions = accepted
        .filter(
          (event) =>
            event.type === 'politique.appliquee' &&
            typeof event.policyVersion === 'number',
        )
        .map((event) => event.policyVersion as number);

      if (appliedVersions.length > 0) {
        const device = await this.prisma.device.findUnique({
          where: { id: deviceId },
          select: { appliedPolicyVersion: true },
        });

        await this.prisma.device.update({
          where: { id: deviceId },
          data: {
            appliedPolicyVersion: Math.max(
              device?.appliedPolicyVersion ?? 0,
              ...appliedVersions,
            ),
          },
        });
      }
    }

    return {
      acknowledged: accepted.map((event) => event.eventId),
      rejected,
    };
  }

  async listBySpace(
    spaceId: string,
    options: {
      cursor?: string;
      limit?: number;
      type?: string;
    },
  ) {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const type = options.type?.trim() || undefined;

    if (type && !allowedEventTypes.has(type)) {
      throw new BadRequestException('Unknown event type');
    }

    const events = await this.prisma.deviceEvent.findMany({
      where: {
        device: { spaceId },
        ...(type ? { type } : {}),
      },
      orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(options.cursor
        ? {
            cursor: { id: options.cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        eventId: true,
        type: true,
        occurredAt: true,
        receivedAt: true,
        policyVersion: true,
        deviceId: true,
      },
    });

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }
}
