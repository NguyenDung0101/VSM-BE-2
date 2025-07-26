import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, EventStatus, PostStatus, RegistrationStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userRole: Role, query?: any) {
    if (userRole !== Role.EDITOR && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Editor và Admin mới có thể xem dashboard');
    }

    const { startDate, endDate, year, month } = query || {};
    
    // Tạo filter date
    const dateFilter = this.createDateFilter(startDate, endDate, year, month);
    
    const [
      userStats,
      eventStats,
      postStats,
      registrationStats,
      recentActivity,
      monthlyData,
    ] = await Promise.all([
      this.getUserStats(dateFilter),
      this.getEventStats(dateFilter),
      this.getPostStats(dateFilter),
      this.getRegistrationStats(dateFilter),
      this.getRecentActivity(),
      this.getMonthlyData(year),
    ]);

    return {
      overview: {
        users: userStats,
        events: eventStats,
        posts: postStats,
        registrations: registrationStats,
      },
      recentActivity,
      monthlyData,
    };
  }

  private createDateFilter(startDate?: string, endDate?: string, year?: string, month?: string) {
    const filter: any = {};

    if (year && month) {
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      filter.gte = startOfMonth;
      filter.lte = endOfMonth;
    } else if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);
      filter.gte = startOfYear;
      filter.lte = endOfYear;
    } else {
      if (startDate) filter.gte = new Date(startDate);
      if (endDate) filter.lte = new Date(endDate);
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  private async getUserStats(dateFilter?: any) {
    const where = dateFilter ? { createdAt: dateFilter } : {};

    const [total, totalUsers, totalEditors, totalAdmins, activeUsers, newUsersThisMonth] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { ...where, role: Role.USER } }),
      this.prisma.user.count({ where: { ...where, role: Role.EDITOR } }),
      this.prisma.user.count({ where: { ...where, role: Role.ADMIN } }),
      this.prisma.user.count({ where: { ...where, isActive: true } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      total,
      byRole: {
        users: totalUsers,
        editors: totalEditors,
        admins: totalAdmins,
      },
      active: activeUsers,
      newThisMonth: newUsersThisMonth,
    };
  }

  private async getEventStats(dateFilter?: any) {
    const where = dateFilter ? { createdAt: dateFilter } : {};

    const [
      total, 
      published, 
      upcoming, 
      ongoing, 
      completed,
      totalParticipants,
      eventsByCategory,
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
          status: RegistrationStatus.CONFIRMED,
          event: where,
        },
      }),
      this.prisma.event.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
      }),
    ]);

    return {
      total,
      published,
      upcoming,
      ongoing,
      completed,
      totalParticipants,
      byCategory: eventsByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private async getPostStats(dateFilter?: any) {
    const where = dateFilter ? { createdAt: dateFilter } : {};

    const [
      total, 
      published, 
      drafts, 
      totalViews, 
      totalLikes,
      postsByCategory,
    ] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.count({ where: { ...where, status: PostStatus.PUBLISHED } }),
      this.prisma.post.count({ where: { ...where, status: PostStatus.DRAFT } }),
      this.prisma.post.aggregate({
        where,
        _sum: { views: true },
      }),
      this.prisma.post.aggregate({
        where,
        _sum: { likes: true },
      }),
      this.prisma.post.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
      }),
    ]);

    return {
      total,
      published,
      drafts,
      totalViews: totalViews._sum.views || 0,
      totalLikes: totalLikes._sum.likes || 0,
      byCategory: postsByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private async getRegistrationStats(dateFilter?: any) {
    const where = dateFilter ? { registeredAt: dateFilter } : {};

    const [total, confirmed, pending, waitlist, cancelled] = await Promise.all([
      this.prisma.eventRegistration.count({ where }),
      this.prisma.eventRegistration.count({ where: { ...where, status: RegistrationStatus.CONFIRMED } }),
      this.prisma.eventRegistration.count({ where: { ...where, status: RegistrationStatus.PENDING } }),
      this.prisma.eventRegistration.count({ where: { ...where, status: RegistrationStatus.WAITLIST } }),
      this.prisma.eventRegistration.count({ where: { ...where, status: RegistrationStatus.CANCELLED } }),
    ]);

    return {
      total,
      confirmed,
      pending,
      waitlist,
      cancelled,
    };
  }

  private async getRecentActivity() {
    const [recentUsers, recentEvents, recentPosts, recentRegistrations] = await Promise.all([
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          date: true,
          location: true,
          currentParticipants: true,
          maxParticipants: true,
          createdAt: true,
          author: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          views: true,
          likes: true,
          createdAt: true,
          author: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.eventRegistration.findMany({
        take: 5,
        orderBy: { registeredAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          status: true,
          registeredAt: true,
          event: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      users: recentUsers,
      events: recentEvents,
      posts: recentPosts,
      registrations: recentRegistrations,
    };
  }

  private async getMonthlyData(year?: string) {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    const months = Array.from({ length: 12 }, (_, i) => {
      const startOfMonth = new Date(currentYear, i, 1);
      const endOfMonth = new Date(currentYear, i + 1, 0, 23, 59, 59);
      return { startOfMonth, endOfMonth, month: i + 1 };
    });

    const monthlyData = await Promise.all(
      months.map(async ({ startOfMonth, endOfMonth, month }) => {
        const [users, events, posts, registrations] = await Promise.all([
          this.prisma.user.count({
            where: {
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          this.prisma.event.count({
            where: {
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          this.prisma.post.count({
            where: {
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          this.prisma.eventRegistration.count({
            where: {
              registeredAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
        ]);

        return {
          month,
          users,
          events,
          posts,
          registrations,
        };
      })
    );

    return monthlyData;
  }

  async getDetailedEventStats(userRole: Role, eventId?: string) {
    if (userRole !== Role.EDITOR && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Editor và Admin mới có thể xem thống kê chi tiết');
    }

    if (eventId) {
      // Thống kê cho một sự kiện cụ thể
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
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
          author: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      if (!event) {
        throw new Error('Sự kiện không tồn tại');
      }

      const registrationsByStatus = event.registrations.reduce((acc, reg) => {
        acc[reg.status] = (acc[reg.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const registrationsByExperience = event.registrations.reduce((acc, reg) => {
        acc[reg.experience] = (acc[reg.experience] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        event: {
          id: event.id,
          name: event.name,
          date: event.date,
          location: event.location,
          maxParticipants: event.maxParticipants,
          currentParticipants: event.currentParticipants,
        },
        registrations: {
          total: event.registrations.length,
          byStatus: registrationsByStatus,
          byExperience: registrationsByExperience,
        },
        recentRegistrations: event.registrations
          .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime())
          .slice(0, 10),
      };
    }

    // Thống kê tổng quan tất cả sự kiện
    const events = await this.prisma.event.findMany({
      include: {
        _count: {
          select: {
            registrations: true,
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    return {
      totalEvents: events.length,
      eventsWithRegistrations: events.filter(e => e._count.registrations > 0).length,
      averageRegistrationsPerEvent: events.reduce((sum, e) => sum + e._count.registrations, 0) / events.length,
      mostPopularEvents: events
        .sort((a, b) => b._count.registrations - a._count.registrations)
        .slice(0, 5)
        .map(e => ({
          id: e.id,
          name: e.name,
          date: e.date,
          registrations: e._count.registrations,
        })),
    };
  }
}
