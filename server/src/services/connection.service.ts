import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SendConnectionRequestInput {
  receiverId: string;
}

export class ConnectionService {
  async sendConnectionRequest(requesterId: string, data: SendConnectionRequestInput) {
    const { receiverId } = data;

    // Check if user is trying to connect with themselves
    if (requesterId === receiverId) {
      throw new Error('Cannot send connection request to yourself');
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId,
          receiverId
        }
      }
    });

    if (existingConnection) {
      throw new Error('Connection request already exists');
    }

    // Check if reverse connection exists
    const reverseConnection = await prisma.connection.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: receiverId,
          receiverId: requesterId
        }
      }
    });

    if (reverseConnection) {
      throw new Error('Connection already exists or pending');
    }

    // Create connection request
    const connection = await prisma.connection.create({
      data: {
        requesterId,
        receiverId,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        }
      }
    });

    return connection;
  }

  async acceptConnectionRequest(requestId: string, userId: string) {
    const connection = await prisma.connection.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        }
      }
    });

    if (!connection) {
      throw new Error('Connection request not found');
    }

    // Only the receiver can accept the request
    if (connection.receiverId !== userId) {
      throw new Error('You can only accept connection requests sent to you');
    }

    if (connection.status !== 'PENDING') {
      throw new Error('Connection request is no longer pending');
    }

    const updatedConnection = await prisma.connection.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        }
      }
    });

    return updatedConnection;
  }

  async rejectConnectionRequest(requestId: string, userId: string) {
    const connection = await prisma.connection.findUnique({
      where: { id: requestId }
    });

    if (!connection) {
      throw new Error('Connection request not found');
    }

    // Only the receiver can reject the request
    if (connection.receiverId !== userId) {
      throw new Error('You can only reject connection requests sent to you');
    }

    if (connection.status !== 'PENDING') {
      throw new Error('Connection request is no longer pending');
    }

    const updatedConnection = await prisma.connection.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        }
      }
    });

    return updatedConnection;
  }

  async getMyConnections(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' }
        ]
      },
      skip,
      take: limit,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            bio: true,
            location: true,
            skills: {
              select: {
                name: true,
                level: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            bio: true,
            location: true,
            skills: {
              select: {
                name: true,
                level: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform to return the other user (not the current user)
    const transformedConnections = connections.map(connection => ({
      id: connection.id,
      user: connection.requesterId === userId ? connection.receiver : connection.requester,
      connectedAt: connection.updatedAt,
      status: connection.status
    }));

    const totalConnections = await prisma.connection.count({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' }
        ]
      }
    });

    const totalPages = Math.ceil(totalConnections / limit);

    return {
      connections: transformedConnections,
      pagination: {
        page,
        limit,
        totalPages,
        totalConnections,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    };
  }

  async getConnectionRequests(userId: string) {
    // Get pending requests sent to the user
    const incomingRequests = await prisma.connection.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            bio: true,
            location: true,
            skills: {
              select: {
                name: true,
                level: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get pending requests sent by the user
    const outgoingRequests = await prisma.connection.findMany({
      where: {
        requesterId: userId,
        status: 'PENDING'
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            bio: true,
            location: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      incoming: incomingRequests,
      outgoing: outgoingRequests
    };
  }

  async discoverDevelopers(userId: string, page: number = 1, limit: number = 20, filters?: {
    skills?: string[];
    location?: string;
    role?: string;
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    // Get users who are not connected and haven't sent/received requests
    const connectedUserIds = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { receiverId: userId }
        ]
      },
      select: {
        requesterId: true,
        receiverId: true
      }
    });

    const excludeUserIds = [
      userId, // Exclude current user
      ...connectedUserIds.map(c => c.requesterId),
      ...connectedUserIds.map(c => c.receiverId)
    ].filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

    const whereClause: any = {
      id: {
        notIn: excludeUserIds
      }
    };

    // Apply filters
    if (filters?.skills && filters.skills.length > 0) {
      whereClause.skills = {
        some: {
          name: {
            in: filters.skills,
            mode: 'insensitive'
          }
        }
      };
    }

    if (filters?.location) {
      whereClause.location = {
        contains: filters.location,
        mode: 'insensitive'
      };
    }

    if (filters?.role) {
      whereClause.role = {
        contains: filters.role,
        mode: 'insensitive'
      };
    }

    if (filters?.search) {
      whereClause.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          bio: {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        bio: true,
        location: true,
        githubUrl: true,
        linkedinUrl: true,
        skills: {
          select: {
            name: true,
            level: true
          }
        },
        _count: {
          select: {
            posts: true,
            sentConnections: {
              where: { status: 'ACCEPTED' }
            },
            receivedConnections: {
              where: { status: 'ACCEPTED' }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to include total connections count
    const transformedUsers = users.map(user => ({
      ...user,
      connectionsCount: user._count.sentConnections + user._count.receivedConnections
    }));

    const totalUsers = await prisma.user.count({
      where: whereClause
    });

    const totalPages = Math.ceil(totalUsers / limit);

    return {
      users: transformedUsers,
      pagination: {
        page,
        limit,
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    };
  }

  async getConnectionSuggestions(userId: string, limit: number = 10) {
    // Get users connected to the current user's connections (mutual connections)
    const userConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' }
        ]
      },
      select: {
        requesterId: true,
        receiverId: true
      }
    });

    const connectedUserIds = userConnections.map(c =>
      c.requesterId === userId ? c.receiverId : c.requesterId
    );

    if (connectedUserIds.length === 0) {
      // If no connections, suggest users with similar skills
      return this.discoverDevelopers(userId, 1, limit);
    }

    // Find users connected to user's connections but not to the user
    const suggestions = await prisma.user.findMany({
      where: {
        id: {
          notIn: [userId, ...connectedUserIds]
        },
        OR: [
          {
            sentConnections: {
              some: {
                receiverId: { in: connectedUserIds },
                status: 'ACCEPTED'
              }
            }
          },
          {
            receivedConnections: {
              some: {
                requesterId: { in: connectedUserIds },
                status: 'ACCEPTED'
              }
            }
          }
        ]
      },
      take: limit,
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        bio: true,
        location: true,
        skills: {
          select: {
            name: true,
            level: true
          }
        },
        _count: {
          select: {
            sentConnections: {
              where: { status: 'ACCEPTED' }
            },
            receivedConnections: {
              where: { status: 'ACCEPTED' }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to include total connections count
    const transformedSuggestions = suggestions.map(user => ({
      ...user,
      connectionsCount: user._count.sentConnections + user._count.receivedConnections
    }));

    return transformedSuggestions;
  }

  async removeConnection(connectionId: string, userId: string) {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    // Only users involved in the connection can remove it
    if (connection.requesterId !== userId && connection.receiverId !== userId) {
      throw new Error('You can only remove your own connections');
    }

    await prisma.connection.delete({
      where: { id: connectionId }
    });

    return { message: 'Connection removed successfully' };
  }
}
