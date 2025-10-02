import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateProjectInput {
  name: string;
  description?: string;
  githubUrl?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  githubUrl?: string;
}

export interface AddProjectMemberInput {
  userId: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeId?: string;
  dueDate?: string;
}

export class ProjectService {
  async createProject(ownerId: string, data: CreateProjectInput) {
    const project = await prisma.project.create({
      data: {
        ...data,
        ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              }
            }
          }
        },
        tasks: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          }
        }
      }
    });

    return project;
  }

  async getProjects(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Get projects where user is owner or member
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      skip,
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              }
            }
          },
          take: 5 // Limit members shown in preview
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const totalProjects = await prisma.project.count({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      }
    });

    const totalPages = Math.ceil(totalProjects / limit);

    return {
      projects,
      pagination: {
        page,
        limit,
        totalPages,
        totalProjects,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    };
  }

  async getProjectById(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        tasks: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          }
        }
      }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    return project;
  }

  async updateProject(projectId: string, userId: string, data: UpdateProjectInput) {
    // Check if user is owner or admin
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    });

    if (!project) {
      throw new Error('Project not found or insufficient permissions');
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          }
        }
      }
    });

    return updatedProject;
  }

  async deleteProject(projectId: string, userId: string) {
    // Only owner can delete project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });

    if (!project) {
      throw new Error('Project not found or only owner can delete project');
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    return { message: 'Project deleted successfully' };
  }

  async addProjectMember(projectId: string, userId: string, data: AddProjectMemberInput) {
    // Check if user is owner or admin
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    });

    if (!project) {
      throw new Error('Project not found or insufficient permissions');
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: data.userId
        }
      }
    });

    if (existingMember) {
      throw new Error('User is already a member of this project');
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: data.userId,
        role: data.role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        }
      }
    });

    return member;
  }

  async removeProjectMember(projectId: string, userId: string, memberId: string) {
    // Check if user is owner or admin
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    });

    if (!project) {
      throw new Error('Project not found or insufficient permissions');
    }

    // Cannot remove the owner
    if (project.ownerId === memberId) {
      throw new Error('Cannot remove project owner');
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: memberId
        }
      }
    });

    return { message: 'Member removed successfully' };
  }

  async getProjectMembers(projectId: string, userId: string) {
    // Check if user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Get project members including owner
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            bio: true,
            skills: true,
            location: true,
            isOnline: true,
            lastActive: true,
            createdAt: true
          }
        }
      }
    });

    // Get project owner details
    const owner = await prisma.user.findUnique({
      where: { id: project.ownerId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        bio: true,
        skills: true,
        location: true,
        isOnline: true,
        lastActive: true,
        createdAt: true
      }
    });

    // Combine owner and members
    const allMembers = [
      ...(owner ? [{
        id: `owner-${owner.id}`,
        userId: owner.id,
        projectId,
        role: 'OWNER' as const,
        joinedAt: project.createdAt,
        user: owner
      }] : []),
      ...members
    ];

    return allMembers;
  }

  async updateMemberRole(projectId: string, userId: string, memberId: string, newRole: 'ADMIN' | 'MEMBER') {
    // Check if user is owner or admin
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    });

    if (!project) {
      throw new Error('Project not found or insufficient permissions');
    }

    // Cannot modify owner role
    if (project.ownerId === memberId) {
      throw new Error('Cannot modify project owner role');
    }

    // Only owners can make/remove admins
    if (newRole === 'ADMIN' && project.ownerId !== userId) {
      throw new Error('Only project owner can assign admin role');
    }

    const member = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId: memberId
        }
      },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          }
        }
      }
    });

    return member;
  }

  // Task Management Methods
  async createTask(projectId: string, userId: string, data: CreateTaskInput) {
    // Check if user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        projectId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'TODO'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return task;
  }

  async getProjectTasks(projectId: string, userId: string) {
    // Check if user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group tasks by status for Kanban view
    const tasksByStatus = {
      TODO: tasks.filter(task => task.status === 'TODO'),
      IN_PROGRESS: tasks.filter(task => task.status === 'IN_PROGRESS'),
      DONE: tasks.filter(task => task.status === 'DONE'),
    };

    return {
      tasks,
      tasksByStatus
    };
  }

  async updateTask(taskId: string, userId: string, data: UpdateTaskInput) {
    // Check if user has access to the task's project
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId: userId
                }
              }
            }
          ]
        }
      }
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return updatedTask;
  }

  async deleteTask(taskId: string, userId: string) {
    // Check if user has access to the task's project
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId: userId
                }
              }
            }
          ]
        }
      }
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    return { message: 'Task deleted successfully' };
  }
}
