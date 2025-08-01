// src/events/events.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from 'src/events/dto/update-event.dto';
import { Role, EventStatus, EventCategory } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto, userId: string, userRole: Role) {
    if (userRole !== Role.EDITOR && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Editor và Admin mới có thể tạo sự kiện');
    }

    const eventData = {
      ...createEventDto,
      date: new Date(createEventDto.date),
      registrationDeadline: createEventDto.registrationDeadline
        ? new Date(createEventDto.registrationDeadline)
        : null,
      authorId: userId,
      currentParticipants: 0,
    };

    return this.prisma.event.create({
      data: eventData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  async findAll(query?: any) {
    const {
      category,
      status,
      featured,
      search,
      upcoming = 'true',
      limit = '10',
      page = '1'
    } = query || {};

    const where: any = { published: true };

    if (category) where.category = category;
    if (status) where.status = status;
    if (featured === 'true') where.featured = true;
    if (upcoming === 'true') {
      where.date = { gte: new Date() };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { date: 'asc' },
        take,
        skip,
        include: {
          author: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              registrations: true,
            }
          }
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      }
    };
  }

  async findAllForAdmin(query: any, userRole: Role) {
    if (userRole !== Role.EDITOR && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Editor và Admin mới có thể xem tất cả sự kiện');
    }

    const {
      category,
      status,
      published,
      search,
      authorId,
      startDate,
      endDate,
      limit = '10',
      page = '1'
    } = query || {};

    const where: any = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (published === 'true' || published === 'false') {
      where.published = published === 'true';
    }
    if (authorId) where.authorId = authorId;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          _count: {
            select: {
              registrations: true,
            }
          }
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      }
    };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            registrations: true,
          }
        }
      },
    });

    if (!event) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, userRole: Role) {
    if (userRole !== Role.EDITOR && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Editor và Admin mới có thể cập nhật sự kiện');
    }

    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    const updateData = {
      ...updateEventDto,
      ...(updateEventDto.date && { date: new Date(updateEventDto.date) }),
      ...(updateEventDto.registrationDeadline && {
        registrationDeadline: new Date(updateEventDto.registrationDeadline)
      }),
    };

    return this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  async remove(id: string, userRole: Role) {
    if (userRole !== Role.EDITOR && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Editor và Admin mới có thể xóa sự kiện');
    }

    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    return this.prisma.event.delete({
      where: { id },
    });
  }

  async getEventStats(query: any, userRole: Role) {
    if (userRole !== Role.EDITOR && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Editor và Admin mới có thể xem thống kê');
    }

    const { startDate, endDate } = query || {};
    const dateFilter: any = {};

    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
    }

    const where = dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {};

    const [
      totalEvents,
      publishedEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
      totalRegistrations,
      eventsByCategory,
      recentEvents,
    ] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.count({ where: { ...where, published: true } }),
      this.prisma.event.count({
        where: {
          ...where,
          status: EventStatus.UPCOMING,
          date: { gte: new Date() }
        }
      }),
      this.prisma.event.count({ where: { ...where, status: EventStatus.ONGOING } }),
      this.prisma.event.count({ where: { ...where, status: EventStatus.COMPLETED } }),
      this.prisma.eventRegistration.count({
        where: {
          event: where,
        }
      }),
      this.prisma.event.groupBy({
        by: ['category'],
        where,
        _count: {
          category: true,
        },
      }),
      this.prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          author: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              registrations: true,
            }
          }
        },
      }),
    ]);

    return {
      overview: {
        totalEvents,
        publishedEvents,
        upcomingEvents,
        ongoingEvents,
        completedEvents,
        totalRegistrations,
      },
      categoryDistribution: eventsByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {} as Record<string, number>),
      recentEvents,
    };
  }
}
