import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreatePostInput {
  type: 'TEXT' | 'MEDIA' | 'CODE';
  content: string;
  codeSnippet?: string;
  language?: string;
  mediaUrls?: string[];
}

export interface UpdatePostInput {
  content?: string;
  codeSnippet?: string;
  language?: string;
}

export class PostService {
  async createPost(authorId: string, data: CreatePostInput) {
    const post = await prisma.post.create({
      data: {
        ...data,
        authorId,
        mediaUrls: data.mediaUrls || [],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        likes: {
          select: {
            id: true,
            userId: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3 // Show only latest 3 comments
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      }
    });

    return post;
  }

  async getPosts(page: number = 1, limit: number = 10, userId?: string) {
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        likes: {
          select: {
            id: true,
            userId: true,
          }
        },
        comments: {
          where: {
            parentId: null // Only get top-level comments for preview
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  }
                },
                replies: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        avatar: true,
                      }
                    }
                  },
                  orderBy: {
                    createdAt: 'asc'
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add isLiked flag for authenticated user
    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLiked: userId ? post.likes.some(like => like.userId === userId) : false
    }));

    // Get total count for pagination
    const totalPosts = await prisma.post.count();
    const totalPages = Math.ceil(totalPosts / limit);

    return {
      posts: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    };
  }

  async getPostById(postId: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        likes: {
          select: {
            id: true,
            userId: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    return {
      ...post,
      isLiked: userId ? post.likes.some(like => like.userId === userId) : false
    };
  }

  async updatePost(postId: string, authorId: string, data: UpdatePostInput) {
    // Verify the post belongs to the user
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.authorId !== authorId) {
      throw new Error('You can only edit your own posts');
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        ...data,
        updatedAt: new Date(),
        isEdited: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      }
    });

    return updatedPost;
  }

  async deletePost(postId: string, authorId: string) {
    // Verify the post belongs to the user
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.authorId !== authorId) {
      throw new Error('You can only delete your own posts');
    }

    await prisma.post.delete({
      where: { id: postId }
    });

    return { message: 'Post deleted successfully' };
  }

  async likePost(postId: string, userId: string) {
    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      return { message: 'Post unliked', isLiked: false };
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          userId,
          postId
        }
      });
      return { message: 'Post liked', isLiked: true };
    }
  }

  async addComment(postId: string, userId: string, content: string, parentId?: string) {
    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        throw new Error('Parent comment not found');
      }

      // Ensure parent comment belongs to the same post
      if (parentComment.postId !== postId) {
        throw new Error('Parent comment does not belong to this post');
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        postId,
        parentId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    return comment;
  }

  async updateComment(commentId: string, userId: string, content: string) {
    // Verify the comment belongs to the user
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, postId: true }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('You can only edit your own comments');
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        updatedAt: new Date(),
        isEdited: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    return updatedComment;
  }

  async deleteComment(commentId: string, userId: string) {
    // Verify the comment belongs to the user
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, postId: true }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('You can only delete your own comments');
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    return { message: 'Comment deleted successfully' };
  }

  async getCommentsForPost(postId: string) {
    const comments = await prisma.comment.findMany({
      where: {
        postId: postId,
        parentId: null // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return comments;
  }

  async getUserPosts(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalPosts = await prisma.post.count({
      where: { authorId: userId }
    });

    return {
      posts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
      }
    };
  }
}
