import { z } from 'zod';

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { ServiceType } from '@prisma/client';
import { createBaseResponseDataSchema } from '@schema';

extendZodWithOpenApi(z);

export const reviewParamSchema = z.object({
  task_id: z.string().openapi({
    description: '任務編號',
    example: '66573506bb73e558b2e52c43',
  }),
});

export const reviewBodySchema = z
  .object({
    order_id: z.string(),
    rating: z.number().min(1).max(5).default(5),
    content: z.string(),
  })
  .openapi({
    example: {
      order_id: '6659fd29fdf9b075e2a9362c',
      rating: 5,
      content: '評價內容',
    },
  });

export const reviewRequestSchema = z.object({
  params: reviewParamSchema,
  body: reviewBodySchema,
});

export const getReviewRequestSchema = z.object({
  params: reviewParamSchema,
});

export const reviewResponseDataSchema = z.object({
  id: z.string(),
  pet_owner_rating: z.number().min(1).max(5).default(5),
  pet_owner_content: z.string(),
  pet_owner_updated_at: z.string(),
  sitter_rating: z.number().min(1).max(5).default(5),
  sitter_content: z.string(),
  sitter_user_updated_at: z.string(),
  pet_owner: z.object({
    id: z.string(),
    email: z.string(),
    real_name: z.string(),
    nickname: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
  }),
  sitter: z.object({
    id: z.string(),
    email: z.string(),
    real_name: z.string(),
    nickname: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
  }),
  task: z.object({
    id: z.string(),
    title: z.string(),
    service_type: z.nativeEnum(ServiceType),
  }),
});

export const ownerReviewResponseDataSchema = z.object({
  id: z.string(),
  sitter_rating: z.number().min(1).max(5).default(5),
  sitter_content: z.string(),
  sitter_user_updated_at: z.date(),
  sitter: z.object({
    id: z.string(),
    email: z.string(),
    real_name: z.string(),
    nickname: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
  }),
  sitter_user_id: z.string(),
  task: z.object({
    id: z.string(),
    title: z.string(),
    service_type: z.nativeEnum(ServiceType),
  }),
});

export const sitterReviewResponseDataSchema = z.object({
  id: z.string(),
  pet_owner_rating: z.number().min(1).max(5).default(5),
  pet_owner_content: z.string(),
  pet_owner_updated_at: z.date(),
  pet_owner: z.object({
    id: z.string(),
    email: z.string(),
    real_name: z.string(),
    nickname: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
  }),
  pet_owner_user_id: z.string(),
  task: z.object({
    id: z.string(),
    title: z.string(),
    service_type: z.nativeEnum(ServiceType),
  }),
});

export const reviewResponseSchema = createBaseResponseDataSchema(reviewResponseDataSchema).openapi({
  description: '指定評價資料',
  example: {
    data: {
      pet_owner_rating: 3,
      pet_owner_content: '改改飼主評價內容',
      pet_owner_updated_at: '2024-06-09T09:17:37.813Z',
      sitter_rating: 3,
      sitter_content: '改改保姆評價內容，推！',
      sitter_user_updated_at: '2024-06-09T09:17:37.811Z',
      pet_owner: {
        id: '6658a67f6676e47b02f23e8b',
        email: '103@mail.com',
        real_name: '103',
        nickname: null,
        avatar: null,
      },
      sitter: {
        id: '6659fb917bce00ca07bcdd14',
        email: '102@mail.com',
        real_name: '102',
        nickname: null,
        avatar: null,
      },
      task: {
        id: '6658a7d754390e6a3ed4370d',
        title: '任務標題103',
        service_type: 'BATH',
      },
    },
    status: true,
  },
});

export const ownerReviewsResponseSchema = z
  .object({
    data: z.object({
      total_reviews: z.number(),
      average_rating: z.number().nullable(),
      owner_reviews: z.array(ownerReviewResponseDataSchema),
    }),
    status: z.boolean(),
  })
  .openapi({
    description: '<指定飼主>所有評價',
    example: {
      data: {
        total_reviews: 1,
        average_rating: 3,
        owner_reviews: [
          {
            id: '665ace0f28dba2608ccfd257',
            sitter_rating: 3,
            sitter_content: '改改保姆評價內容，推！',
            sitter_user_updated_at: new Date('2024-06-09T09:17:37.811Z'),
            sitter: {
              id: '6659fb917bce00ca07bcdd14',
              email: '102@mail.com',
              real_name: '102',
              nickname: null,
              avatar: null,
            },
            sitter_user_id: '6659fb917bce00ca07bcdd14',
            task: {
              id: '6658a7d754390e6a3ed4370d',
              title: '任務標題103',
              service_type: 'BATH',
            },
          },
        ],
      },
      status: true,
    },
  });

export const sitterReviewsResponseSchema = z
  .object({
    data: z.object({
      total_reviews: z.number(),
      average_rating: z.number(),
      sitter_reviews: z.array(sitterReviewResponseDataSchema).default([]),
    }),
    status: z.boolean(),
  })
  .openapi({
    description: '<指定保姆>所有評價',
    example: {
      data: {
        total_reviews: 1,
        average_rating: 3,
        sitter_reviews: [
          {
            id: '665ace0f28dba2608ccfd257',
            pet_owner_rating: 3,
            pet_owner_content: '改改飼主評價內容',
            pet_owner_updated_at: new Date('2024-06-09T09:17:37.813Z'),
            pet_owner: {
              id: '6658a67f6676e47b02f23e8b',
              email: '103@mail.com',
              real_name: '103',
              nickname: null,
              avatar: null,
            },
            pet_owner_user_id: '6658a67f6676e47b02f23e8b',
            task: {
              id: '6658a7d754390e6a3ed4370d',
              title: '任務標題103',
              service_type: 'BATH',
            },
          },
        ],
      },
      status: true,
    },
  });

export type ReviewParam = z.infer<typeof reviewParamSchema>;
export type ReviewRequest = z.infer<typeof reviewRequestSchema>;
export type GetReviewRequest = z.infer<typeof getReviewRequestSchema>;
