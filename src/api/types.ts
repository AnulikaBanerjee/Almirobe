import type { components } from '@/api/generated/schema';

export type ApiErrorBody = components['schemas']['ErrorResponse'];
export type ApiUserDto = components['schemas']['UserDto'];
export type ApiProfileDto = components['schemas']['ProfileDto'];
export type AuthTokensResponse = components['schemas']['AuthTokensResponse'];
export type MeResponse = components['schemas']['MeResponse'];
export type CreateUploadUrlRequest = components['schemas']['CreateUploadUrlRequest'];
export type CreateUploadUrlResponse = components['schemas']['CreateUploadUrlResponse'];
export type CreateImageJobRequest = components['schemas']['CreateImageJobRequest'];
export type ImageJobResponse = components['schemas']['ImageJobResponse'];
export type TagCatalog = components['schemas']['TagCatalog'];
