import { z } from 'zod';

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PetSize, SitterStatus } from '@prisma/client';
import { objectIdSchema } from '@schema/objectId';
import { paginationSchema } from '@schema/pagination';

extendZodWithOpenApi(z);

export const applySitterRequestSchema = z.object({
  body: z
    .object({
      certificate_number: z.string(),
      certificate_image: z.string().url(),
      police_check_image: z.string().url().optional(),
    })
    .openapi({
      example: {
        certificate_number: '12345678',
        certificate_image: 'https://picsum.photos/200',
        police_check_image: 'https://picsum.photos/200',
      },
    }),
});

const sitterServiceRequestSchema = z
  .object({
    service_city: z.string(),
    service_district_list: z.array(z.string()).min(1),
    photography_price: z.number().nullable(),
    health_care_price: z.number().nullable(),
    bath_price: z.number().nullable(),
    walking_price: z.number().nullable(),
    service_size_list: z.array(z.nativeEnum(PetSize)).min(1).max(3),
    is_door_to_door: z.boolean().default(false),
    image_list: z.array(z.string().url()).min(1).max(3),
    service_description: z.string(),
  })
  .openapi({
    example: {
      service_city: '台北市',
      service_district_list: ['中正區', '大同區'],
      photography_price: 100,
      health_care_price: 200,
      bath_price: 300,
      walking_price: 400,
      service_size_list: [PetSize.S, PetSize.M],
      is_door_to_door: true,
      image_list: ['https://picsum.photos/200', 'https://picsum.photos/200'],
      service_description: '服務說明',
    },
  });

export const updateSitterServiceRequestSchema = z.object({
  body: sitterServiceRequestSchema,
});

export const sitterRequestSchema = z.object({
  params: z.object({
    user_id: objectIdSchema,
  }),
});

export const sitterResponseSchema = z
  .object({
    user_id: objectIdSchema,
    has_certificate: z.boolean().default(false),
    has_police_check: z.boolean().default(false),
    photography_price: z.number().nullable(),
    health_care_price: z.number().nullable(),
    bath_price: z.number().nullable(),
    walking_price: z.number().nullable(),
    service_size_list: z.array(z.nativeEnum(PetSize)).min(1).max(3),
    is_door_to_door: z.boolean().default(false),
    image_list: z.array(z.string()).min(1).max(3),
    service_description: z.string(),
    average_rating: z.number().nullable(),
    total_reviews: z.number().default(0),
    status: z.nativeEnum(SitterStatus).nullable(),
  })
  .openapi({
    example: {
      user_id: '54489faba8bcd77a22dedue8',
      has_certificate: true,
      has_police_check: true,
      photography_price: 100,
      health_care_price: 200,
      bath_price: 300,
      walking_price: 400,
      service_size_list: [PetSize.S, PetSize.M],
      is_door_to_door: true,
      image_list: ['https://picsum.photos/200', 'https://picsum.photos/200'],
      service_description: '服務說明',
      average_rating: 4.5,
      total_reviews: 10,
      status: SitterStatus.APPROVING,
    },
  });

export const sitterRequestQuerySchema = z.object({
  query: paginationSchema.extend({
    service_city: z.string(), // oprional for debugging -> need to change to must.
    service_district_list: z.array(z.string()).min(1), // oprional for debugging -> need to change to must.
  }),
});

export type ApplySitterRequest = z.infer<typeof applySitterRequestSchema>;
export type UpdateSitterServiceRequest = z.infer<typeof updateSitterServiceRequestSchema>;
export type SitterRequest = z.infer<typeof sitterRequestSchema>;
export type SitterResponse = z.infer<typeof sitterResponseSchema>;
export type SitterRequestQuery = z.infer<typeof sitterRequestQuerySchema>;
