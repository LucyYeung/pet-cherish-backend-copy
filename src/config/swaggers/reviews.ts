import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { BearerAuth } from '@schema/bearerAuth';
import {
  ownerReviewsResponseSchema,
  reviewBodySchema,
  reviewParamSchema,
  reviewResponseSchema,
  sitterReviewsResponseSchema,
} from '@schema/review';
import { userBaseSchema } from '@schema/user';

export const setReviewsSwagger = (registry: OpenAPIRegistry, bearerAuth: BearerAuth) => {
  createReview(registry, bearerAuth);
  updateReview(registry, bearerAuth);
  getReviewByTaskId(registry, bearerAuth);
  getOwnerReviews(registry);
  getSitterReviews(registry);
};

const commonReviewSetting = (bearerAuth: BearerAuth) => ({
  tags: ['Reviews'],
  path: '/api/v1/tasks/{task_id}/review',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: reviewParamSchema,
    body: {
      content: {
        'application/json': {
          schema: reviewBodySchema,
        },
      },
    },
  },
  responses: {
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Forbidden',
    },
    404: {
      description: 'Order is not found!',
    },
  },
});

const createReview = (registry: OpenAPIRegistry, bearerAuth: BearerAuth) => {
  const { tags, path, security, request, responses } = commonReviewSetting(bearerAuth);
  registry.registerPath({
    tags,
    path,
    security,
    request,
    method: 'post',
    summary: '新增：飼主/保姆 評價',
    responses: {
      201: {
        description: 'Create Successfully!',
      },
      ...responses,
    },
  });
};

const updateReview = (registry: OpenAPIRegistry, bearerAuth: BearerAuth) => {
  const { tags, path, security, request, responses } = commonReviewSetting(bearerAuth);

  registry.registerPath({
    tags,
    path,
    security,
    request,
    method: 'patch',
    summary: '編輯：飼主/保姆 評價',
    responses: {
      200: {
        description: 'Update Successfully!',
      },
      ...responses,
    },
  });
};

const getReviewByTaskId = (registry: OpenAPIRegistry, bearerAuth: BearerAuth) => {
  const { tags, path, security, request } = commonReviewSetting(bearerAuth);

  registry.registerPath({
    tags,
    path,
    security,
    request: {
      params: request.params,
    },
    method: 'get',
    summary: '查詢：指定評價',
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: reviewResponseSchema,
          },
        },
      },
      404: {
        description: 'Review is not found!',
      },
    },
  });
};

const getOwnerReviews = (registry: OpenAPIRegistry) => {
  registry.registerPath({
    method: 'get',
    tags: ['Reviews'],
    path: '/api/v1/pet-owners/{user_id}/reviews',
    summary: '查詢：飼主所有評價',
    request: {
      params: userBaseSchema,
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: ownerReviewsResponseSchema,
          },
        },
      },
      404: {
        description: 'User not found',
      },
    },
  });
};

const getSitterReviews = (registry: OpenAPIRegistry) => {
  registry.registerPath({
    method: 'get',
    tags: ['Reviews'],
    path: '/api/v1/sitters/{user_id}/reviews',
    summary: '查詢：保姆所有評價',
    request: {
      params: userBaseSchema,
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: sitterReviewsResponseSchema,
          },
        },
      },
      404: {
        description: 'Sitter not found',
      },
    },
  });
};
