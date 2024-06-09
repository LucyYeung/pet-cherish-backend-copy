import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

import prisma from '@prisma';
import {
  ownerReviewsResponseSchema,
  reviewBodySchema,
  reviewParamSchema,
  sitterReviewsResponseSchema,
} from '@schema/review';
import { UserBaseSchema } from '@schema/user';

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  const { task_id } = reviewParamSchema.parse(req.params);
  const { order_id, rating, content } = reviewBodySchema.parse(req.body);
  if (!req.user?.id) {
    throw createHttpError(403, 'Forbidden');
  }

  const handleOwnerReview = async (sitter_user_id: string) => {
    try {
      await prisma.$transaction(async (prisma) => {
        // (1) 飼主撰寫評價：
        const newReview = await prisma.review.create({
          data: {
            task_id,
            pet_owner_user_id: req.user!.id,
            pet_owner_rating: rating,
            pet_owner_content: content,
            sitter_user_id,
          },
        });

        // (2) Task 掛 review_id
        await prisma.task.update({
          where: {
            id: task_id,
          },
          data: {
            review_id: newReview.id,
          },
        });

        // 重新計算[保姆]所有評價平均分：
        const newAverageRating = await prisma.review.aggregate({
          where: {
            sitter_user_id,
          },
          _avg: {
            pet_owner_rating: true,
          },
        });
        // 取得[保姆]評價最新總計：
        const newTotalReviews = await prisma.sitter.count({
          where: {
            user_id: sitter_user_id,
          },
        });

        // (3) 更新[保姆] Sitter: average_rating, total_reviews
        await prisma.sitter.update({
          where: {
            user_id: sitter_user_id,
          },
          data: {
            average_rating: newAverageRating._avg.pet_owner_rating || 0,
            total_reviews: newTotalReviews,
          },
        });
      });
    } catch (error) {
      console.log('handleReviewByOwner error: ', error);
      throw error;
    }
  };

  const handleSitterReview = async (pet_owner_user_id: string) => {
    try {
      await prisma.$transaction(async (prisma) => {
        // (1) 保姆撰寫評價：
        await prisma.review.update({
          where: {
            task_id,
          },
          data: {
            sitter_rating: rating,
            sitter_content: content,
            sitter_user_created_at: new Date(),
            sitter_user_updated_at: new Date(),
          },
        });

        // 重新計算[飼主]所有評價平均分：
        const newAverageRating = await prisma.review.aggregate({
          where: {
            pet_owner_user_id,
          },
          _avg: {
            sitter_rating: true,
          },
        });

        // 取得[飼主]評價最新總計：
        const newTotalReviews = await prisma.user.count({
          where: {
            id: pet_owner_user_id,
          },
        });

        // (2) 更新[飼主] User: average_rating, total_reviews
        await prisma.user.update({
          where: {
            id: pet_owner_user_id,
          },
          data: {
            average_rating: newAverageRating._avg.sitter_rating || 0,
            total_reviews: newTotalReviews,
          },
        });
      });
    } catch (error) {
      console.log('handleSitterReview error: ', error);
      throw error;
    }
  };

  try {
    // 找到指定訂單
    const targetOrder = await prisma.order.findUnique({
      where: {
        id: order_id,
      },
      include: {
        task: true,
      },
    });
    if (!targetOrder) {
      res.status(404).json({
        message: 'Order is not found!',
        status: false,
      });
      return;
    }
    if (targetOrder.task.review_id) {
      res.status(400).json({
        message: 'Review has been created!',
        status: false,
      });
    }

    if (targetOrder.pet_owner_user_id === req.user.id) {
      // 飼主寫評價
      handleOwnerReview(targetOrder.sitter_user_id);
    } else {
      // 保姆寫評價
      handleSitterReview(targetOrder.pet_owner_user_id);
    }

    res.status(201).json({
      message: 'Create Successfully!',
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  const { task_id } = reviewParamSchema.parse(req.params);
  const { order_id, rating, content } = reviewBodySchema.parse(req.body);
  if (!req.user?.id) {
    throw createHttpError(403, 'Forbidden');
  }

  try {
    // 找到指定訂單
    const targetOrder = await prisma.order.findUnique({
      where: {
        id: order_id,
      },
    });
    if (!targetOrder) {
      res.status(404).json({
        message: 'Order is not found!',
        status: false,
      });
      return;
    }

    if (targetOrder.pet_owner_user_id !== req.user.id && targetOrder.sitter_user_id !== req.user.id) {
      res.status(403).json({
        message: 'Forbidden!',
        status: false,
      });
      return;
    }

    if (targetOrder.pet_owner_user_id === req.user.id) {
      // 飼主更新評價
      await prisma.review.update({
        where: {
          task_id,
        },
        data: {
          pet_owner_rating: rating,
          pet_owner_content: content,
          pet_owner_updated_at: new Date(),
        },
      });
    } else {
      // 保姆更新評價
      await prisma.review.update({
        where: {
          task_id,
        },
        data: {
          sitter_rating: rating,
          sitter_content: content,
          sitter_user_updated_at: new Date(),
        },
      });
    }

    res.status(200).json({
      message: 'Update Successfully!',
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewByTaskId = async (req: Request, res: Response, next: NextFunction) => {
  const { task_id } = reviewParamSchema.parse(req.params);

  try {
    const targetReview = await prisma.review.findUnique({
      where: {
        task_id,
      },
      select: {
        pet_owner_rating: true,
        pet_owner_content: true,
        pet_owner_updated_at: true,
        sitter_rating: true,
        sitter_content: true,
        sitter_user_updated_at: true,
        pet_owner: {
          select: {
            id: true,
            email: true,
            real_name: true,
            nickname: true,
            avatar: true,
          },
        },
        sitter: {
          select: {
            id: true,
            email: true,
            real_name: true,
            nickname: true,
            avatar: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            service_type: true,
          },
        },
      },
    });
    if (!targetReview) {
      res.status(404).json({
        message: 'Review is not found!',
        status: false,
      });
      return;
    }

    res.status(200).json({
      data: targetReview,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

export const getOwnerReviews = async (req: Request<UserBaseSchema>, res: Response, next: NextFunction) => {
  const { user_id } = req.params;

  try {
    const ownerReviews = await prisma.user.findUnique({
      where: {
        id: user_id,
      },
      select: {
        average_rating: true,
        total_reviews: true,
        owner_reviews: {
          select: {
            // 只回傳保姆對飼主的評價
            id: true,
            sitter_rating: true,
            sitter_content: true,
            sitter_user_updated_at: true,
            sitter: {
              select: {
                id: true,
                email: true,
                real_name: true,
                nickname: true,
                avatar: true,
              },
            },
            sitter_user_id: true,
            task: {
              select: {
                id: true,
                title: true,
                service_type: true,
              },
            },
          },
        },
      },
    });

    const data = ownerReviewsResponseSchema.shape.data.parse(ownerReviews);

    res.status(200).json({
      data,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

export const getSitterReviews = async (req: Request<UserBaseSchema>, res: Response, next: NextFunction) => {
  const { user_id } = req.params;

  try {
    const sitterReviews = await prisma.user.findUnique({
      where: {
        id: user_id,
      },
      select: {
        sitter: {
          select: {
            total_reviews: true,
            average_rating: true,
          },
        },
        sitter_reviews: {
          select: {
            // 只回傳飼主對保姆的評價
            id: true,
            pet_owner_rating: true,
            pet_owner_content: true,
            pet_owner_updated_at: true,
            pet_owner: {
              select: {
                id: true,
                email: true,
                real_name: true,
                nickname: true,
                avatar: true,
              },
            },
            pet_owner_user_id: true,
            task: {
              select: {
                id: true,
                title: true,
                service_type: true,
              },
            },
          },
        },
      },
    });

    const data = sitterReviewsResponseSchema.shape.data.parse(sitterReviews);

    res.status(200).json({
      data,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};
