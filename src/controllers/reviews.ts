import { NextFunction, Request, Response } from 'express';

import prisma from '@prisma';
import { ReviewParam, ReviewRequest } from '@schema/review';
import { UserBaseSchema } from '@schema/user';

export const createReview = async (
  req: Request<ReviewParam, unknown, ReviewRequest>,
  res: Response,
  next: NextFunction
) => {
  const { task_id } = req.params;
  const { user_id, rating, content } = req.body;

  const handleOwnerReview = async (sitter_user_id: string) => {
    try {
      await prisma.$transaction(async (prisma) => {
        // (1) 飼主撰寫評價：
        const newReview = await prisma.review.create({
          data: {
            task_id,
            pet_owner_user_id: user_id,
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
        id: task_id,
      },
    });
    if (!targetOrder) {
      res.status(404).json({
        message: 'Order is not found!',
        status: false,
      });
      return;
    }

    if (targetOrder.pet_owner_user_id === req.body.user_id) {
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

export const updateReview = async (
  req: Request<ReviewParam, unknown, ReviewRequest>,
  res: Response,
  next: NextFunction
) => {
  const { task_id } = req.params;
  const { user_id, rating, content } = req.body;

  try {
    // 找到指定訂單
    const targetOrder = await prisma.order.findUnique({
      where: {
        id: task_id,
      },
    });
    if (!targetOrder) {
      res.status(404).json({
        message: 'Order is not found!',
        status: false,
      });
      return;
    }

    if (targetOrder.pet_owner_user_id === user_id) {
      // 飼主更新評價
      await prisma.review.update({
        where: {
          task_id: targetOrder.task_id,
        },
        data: {
          pet_owner_rating: rating,
          pet_owner_content: content,
        },
      });
    } else {
      // 保姆更新評價
      await prisma.review.update({
        where: {
          task_id: targetOrder.task_id,
        },
        data: {
          sitter_rating: rating,
          sitter_content: content,
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

export const getReviewByTaskId = async (req: Request<ReviewParam>, res: Response, next: NextFunction) => {
  const { task_id } = req.params;

  try {
    const targetReview = await prisma.review.findUnique({
      where: {
        id: task_id,
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
    const ownerReviews = await prisma.review.findMany({
      where: {
        pet_owner_user_id: user_id,
      },
    });
    res.status(200).json({
      data: ownerReviews,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

export const getSitterReviews = async (req: Request<UserBaseSchema>, res: Response, next: NextFunction) => {
  const { user_id } = req.params;

  try {
    const ownerReviews = await prisma.review.findMany({
      where: {
        sitter_user_id: user_id,
      },
    });
    res.status(200).json({
      data: ownerReviews,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};
