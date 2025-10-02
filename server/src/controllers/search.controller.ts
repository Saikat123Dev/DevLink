import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Validation schemas
const searchSchema = z.object({
  q: z.string().optional().default(''),
  type: z.enum(['all', 'developers', 'projects', 'posts']).default('all'),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  experience: z.enum(['any', 'entry', 'mid', 'senior', 'lead']).optional(),
  rating: z.array(z.number()).optional(),
  availability: z.boolean().optional(),
  isRemote: z.boolean().optional(),
  budget: z.string().optional(),
  projectStatus: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD']).optional(),
  projectType: z.string().optional(),
  sortBy: z.enum(['relevance', 'newest', 'rating', 'experience']).default('relevance'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
});

export class SearchController {
  // Universal search endpoint
  async search(req: AuthenticatedRequest, res: Response) {
    try {
      const searchParams = searchSchema.parse(req.query);
      const {
        q,
        type,
        skills,
        location,
        experience,
        rating,
        availability,
        isRemote,
        budget,
        projectStatus,
        projectType,
        sortBy,
        page,
        limit
      } = searchParams;

      const skip = (page - 1) * limit;
      const searchTerm = q.toLowerCase();

      let results: any = {};

      if (type === 'all' || type === 'developers') {
        results.developers = await this.searchDevelopers({
          searchTerm,
          skills,
          location,
          experience,
          rating,
          availability,
          sortBy,
          skip,
          limit
        });
      }

      if (type === 'all' || type === 'projects') {
        results.projects = await this.searchProjects({
          searchTerm,
          isRemote,
          budget,
          projectStatus,
          projectType,
          skills,
          sortBy,
          skip,
          limit
        });
      }

      if (type === 'all' || type === 'posts') {
        results.posts = await this.searchPosts({
          searchTerm,
          sortBy,
          skip,
          limit
        });
      }

      res.json({
        success: true,
        data: results,
        pagination: {
          page,
          limit,
          hasMore: type === 'all'
            ? Object.values(results).some((items: any) => items.length === limit)
            : results[type === 'developers' ? 'developers' : type === 'projects' ? 'projects' : 'posts']?.length === limit
        }
      });
    } catch (error: any) {
      console.error('Error searching:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search'
      });
    }
  }

  // Search developers
  async searchDevelopers(params: {
    searchTerm: string;
    skills?: string[];
    location?: string;
    experience?: string;
    rating?: number[];
    availability?: boolean;
    sortBy?: string;
    skip: number;
    limit: number;
  }) {
    const { searchTerm, skills, location, experience, rating, availability, sortBy, skip, limit } = params;

    const whereClause: any = {};

    // Only add text search if searchTerm is not empty
    if (searchTerm && searchTerm.trim().length > 0) {
      whereClause.OR = [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          bio: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          role: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Add filters
    if (skills && skills.length > 0) {
      whereClause.skills = {
        some: {
          name: {
            in: skills,
            mode: 'insensitive'
          }
        }
      };
    }

    if (location) {
      whereClause.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    if (experience && experience !== 'any') {
      whereClause.experience = {
        contains: experience,
        mode: 'insensitive'
      };
    }

    // Rating filter
    if (rating && rating.length > 0) {
      const minRating = Math.min(...rating);
      if (minRating > 0) {
        whereClause.rating = {
          gte: minRating
        };
      }
    }

    if (availability !== undefined) {
      whereClause.isAvailable = availability;
    }

    // Dynamic ordering based on sortBy
    let orderBy: any[] = [];
    switch (sortBy) {
      case 'rating':
        orderBy = [{ rating: 'desc' }, { completedProjects: 'desc' }];
        break;
      case 'experience':
        orderBy = [{ completedProjects: 'desc' }, { rating: 'desc' }];
        break;
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      default: // relevance
        orderBy = [{ rating: 'desc' }, { completedProjects: 'desc' }, { createdAt: 'desc' }];
    }

    const developers = await prisma.user.findMany({
      where: whereClause,
      include: {
        skills: true,
        _count: {
          select: {
            ownedProjects: true,
            projectMembers: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    return developers.map(dev => ({
      id: dev.id,
      name: dev.name,
      bio: dev.bio,
      avatar: dev.avatar,
      role: dev.role,
      location: dev.location,
      experience: dev.experience,
      hourlyRate: dev.hourlyRate,
      isAvailable: dev.isAvailable,
      rating: dev.rating,
      completedProjects: dev.completedProjects,
      skills: dev.skills.map(s => ({ name: s.name, level: s.level })),
      projectsCount: dev._count.ownedProjects + dev._count.projectMembers,
      isOnline: dev.isOnline
    }));
  }

  // Search projects
  async searchProjects(params: {
    searchTerm: string;
    isRemote?: boolean;
    budget?: string;
    projectStatus?: string;
    projectType?: string;
    skills?: string[];
    sortBy?: string;
    skip: number;
    limit: number;
  }) {
    const { searchTerm, isRemote, budget, projectStatus, projectType, skills, sortBy, skip, limit } = params;

    const whereClause: any = {};

    // Only add text search if searchTerm is not empty
    if (searchTerm && searchTerm.trim().length > 0) {
      whereClause.OR = [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Add filters
    if (isRemote !== undefined) {
      whereClause.isRemote = isRemote;
    }

    if (budget) {
      whereClause.budget = {
        contains: budget,
        mode: 'insensitive'
      };
    }

    if (projectStatus) {
      whereClause.status = projectStatus;
    }

    // Note: Project type and technologies filtering removed as these fields don't exist in the schema
    // If you want to add these features, you'll need to add these fields to the Project model

    // Dynamic ordering for projects
    let orderBy: any[] = [];
    switch (sortBy) {
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'rating':
        orderBy = [{ owner: { rating: 'desc' } }, { createdAt: 'desc' }];
        break;
      default: // relevance
        orderBy = [{ createdAt: 'desc' }];
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      githubUrl: project.githubUrl,
      status: project.status,
      isRemote: project.isRemote,
      budget: project.budget,
      duration: project.duration,
      owner: project.owner,
      membersCount: project._count.members,
      tasksCount: project._count.tasks,
      technologies: [], // Placeholder since technologies field doesn't exist in schema
      teamSize: project._count.members + 1, // Including owner
      createdAt: project.createdAt
    }));
  }

  // Search posts
  async searchPosts(params: {
    searchTerm: string;
    sortBy?: string;
    skip: number;
    limit: number;
  }) {
    const { searchTerm, sortBy, skip, limit } = params;

    const whereClause: any = {};

    // Only add text search if searchTerm is not empty
    if (searchTerm && searchTerm.trim().length > 0) {
      whereClause.OR = [
        {
          content: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          codeSnippet: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          language: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Dynamic ordering for posts
    let orderBy: any[] = [];
    switch (sortBy) {
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'rating':
        orderBy = [{ _count: { likes: 'desc' } }, { createdAt: 'desc' }];
        break;
      default: // relevance
        orderBy = [{ createdAt: 'desc' }];
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    return posts.map(post => ({
      id: post.id,
      type: post.type,
      content: post.content,
      codeSnippet: post.codeSnippet,
      language: post.language,
      mediaUrls: post.mediaUrls,
      author: post.author,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isEdited: post.isEdited,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));
  }

  // Get search suggestions
  async getSuggestions(req: AuthenticatedRequest, res: Response) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json({
          success: true,
          data: {
            skills: [],
            locations: [],
            technologies: []
          }
        });
      }

      const searchTerm = q.toLowerCase();

      // Get skill suggestions
      const skills = await prisma.skill.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        select: { name: true },
        distinct: ['name'],
        take: 10
      });

      // Get location suggestions
      const locations = await prisma.user.findMany({
        where: {
          location: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        select: { location: true },
        distinct: ['location'],
        take: 10
      });

      // For technologies, we'd need to add a technologies field to the schema
      // For now, return common tech suggestions
      const commonTechnologies = [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
        'C++', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby', 'C#',
        'Vue.js', 'Angular', 'Next.js', 'Express.js', 'Django', 'Flask',
        'Spring', 'Laravel', 'Rails', 'ASP.NET', 'Docker', 'Kubernetes',
        'AWS', 'Azure', 'Google Cloud', 'MongoDB', 'PostgreSQL', 'MySQL',
        'Redis', 'GraphQL', 'REST API', 'Machine Learning', 'AI', 'Blockchain'
      ];

      const technologies = commonTechnologies
        .filter(tech => tech.toLowerCase().includes(searchTerm))
        .slice(0, 10);

      res.json({
        success: true,
        data: {
          skills: skills.map(s => s.name),
          locations: locations.map(l => l.location).filter(Boolean),
          technologies
        }
      });
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get suggestions'
      });
    }
  }

  // Get filters for advanced search
  async getFilters(req: AuthenticatedRequest, res: Response) {
    try {
      // Get available skills
      const skills = await prisma.skill.findMany({
        select: { name: true },
        distinct: ['name'],
        orderBy: { name: 'asc' }
      });

      // Get available locations
      const locations = await prisma.user.findMany({
        where: {
          location: { not: null }
        },
        select: { location: true },
        distinct: ['location'],
        orderBy: { location: 'asc' }
      });

      // Get project budget ranges (you might want to standardize these)
      const budgetRanges = [
        'Under $1,000',
        '$1,000 - $5,000',
        '$5,000 - $10,000',
        '$10,000 - $25,000',
        '$25,000 - $50,000',
        '$50,000+'
      ];

      res.json({
        success: true,
        data: {
          skills: skills.map(s => s.name),
          locations: locations.map(l => l.location).filter(Boolean),
          experienceLevels: ['junior', 'mid', 'senior'],
          projectStatuses: ['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD'],
          budgetRanges
        }
      });
    } catch (error: any) {
      console.error('Error getting filters:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get filters'
      });
    }
  }

  // Save search query (for analytics)
  async saveSearchQuery(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { query, type, resultsCount } = z.object({
        query: z.string(),
        type: z.string(),
        resultsCount: z.number()
      }).parse(req.body);

      // Record search analytics
      await prisma.analytics.create({
        data: {
          userId,
          type: 'search_query',
          data: {
            query,
            searchType: type,
            resultsCount,
            timestamp: new Date()
          }
        }
      });

      res.json({
        success: true,
        message: 'Search query saved'
      });
    } catch (error: any) {
      console.error('Error saving search query:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to save search query'
      });
    }
  }
}
