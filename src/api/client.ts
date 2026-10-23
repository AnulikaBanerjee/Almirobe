import type {
  ApiErrorBody,
  AuthTokensResponse,
  CreateImageJobRequest,
  CreateUploadUrlRequest,
  CreateUploadUrlResponse,
  ImageJobResponse,
  MeResponse,
  TagCatalog,
} from '@/api/types';
import {
  clearStoredActiveProfileId,
  clearStoredRefreshToken,
  getStoredRefreshToken,
  setStoredActiveProfileId,
  setStoredRefreshToken,
} from '@/api/sessionStorage';

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function apiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
  return base.replace(/\/$/, '');
}

export class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<AuthTokensResponse> | null = null;

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async register(input: { email: string; password: string; name?: string }): Promise<AuthTokensResponse> {
    const response = await this.request<AuthTokensResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuth: true,
    });
    this.applyAuthResponse(response);
    return response;
  }

  async login(input: { email: string; password: string }): Promise<AuthTokensResponse> {
    const response = await this.request<AuthTokensResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuth: true,
    });
    this.applyAuthResponse(response);
    return response;
  }

  async loginWithGoogle(idToken: string): Promise<AuthTokensResponse> {
    const response = await this.request<AuthTokensResponse>('/api/v1/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      skipAuth: true,
    });
    this.applyAuthResponse(response);
    return response;
  }

  async sendPhoneOtp(phone: string): Promise<{
    phone: string;
    expiresInSeconds: number;
    debugCode?: string | null;
  }> {
    return this.request('/api/v1/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      skipAuth: true,
    });
  }

  async verifyPhoneOtp(phone: string, code: string): Promise<AuthTokensResponse> {
    const response = await this.request<AuthTokensResponse>('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
      skipAuth: true,
    });
    this.applyAuthResponse(response);
    return response;
  }

  async refreshSession(): Promise<AuthTokensResponse | null> {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return null;

    if (!this.refreshPromise) {
      this.refreshPromise = this.request<AuthTokensResponse>('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
      })
        .then((response) => {
          this.applyAuthResponse(response);
          return response;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  async logout(): Promise<void> {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      try {
        await this.request<void>('/api/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          skipAuth: true,
        });
      } catch {
        // Best-effort logout
      }
    }
    this.clearSession();
  }

  async me(): Promise<MeResponse> {
    return this.request<MeResponse>('/api/v1/auth/me', { method: 'GET' });
  }

  async getCatalogTags(): Promise<TagCatalog> {
    return this.request<TagCatalog>('/api/v1/catalog/tags', { method: 'GET' });
  }

  async createUploadUrl(input: CreateUploadUrlRequest, idempotencyKey?: string): Promise<CreateUploadUrlResponse> {
    return this.request<CreateUploadUrlResponse>('/api/v1/media/upload-url', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
  }

  async createImageJob(input: CreateImageJobRequest, idempotencyKey?: string): Promise<ImageJobResponse> {
    return this.request<ImageJobResponse>('/api/v1/image-jobs', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
  }

  async getImageJob(jobId: string): Promise<ImageJobResponse> {
    return this.request<ImageJobResponse>(`/api/v1/image-jobs/${jobId}`, { method: 'GET' });
  }

  async importRemoteImage(pageUrl: string): Promise<File> {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }
    const response = await fetch(`${apiBaseUrl()}/api/v1/media/import-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: pageUrl }),
    });
    if (response.status === 401) {
      const refreshed = await this.refreshSession();
      if (refreshed) return this.importRemoteImage(pageUrl);
      this.clearSession();
      throw new ApiClientError('UNAUTHORIZED', 'Session expired', 401);
    }
    if (!response.ok) {
      let message = `Could not import that link (${response.status})`;
      try {
        const body = (await response.json()) as ApiErrorBody;
        if (body.message) message = body.message;
      } catch {
        // response was not JSON
      }
      throw new ApiClientError('IMPORT_FAILED', message, response.status);
    }
    const blob = await response.blob();
    const type = blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
    const ext = type.includes('png') ? 'png' : 'jpg';
    return new File([blob], `linked-item.${ext}`, { type });
  }

  /** Ghost-mannequin cutout (SegFormer + SD inpaint + rembg) via backend → ghost worker. */
  async extractGarmentGhost(file: File): Promise<Blob> {
    const form = new FormData();
    form.append('file', file);
    const headers = new Headers();
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }
    const response = await fetch(`${apiBaseUrl()}/api/v1/media/extract-garment`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (response.status === 401) {
      const refreshed = await this.refreshSession();
      if (refreshed) return this.extractGarmentGhost(file);
      this.clearSession();
      throw new ApiClientError('UNAUTHORIZED', 'Session expired', 401);
    }
    if (!response.ok) {
      let message = `Garment extraction failed (${response.status})`;
      try {
        const body = (await response.json()) as ApiErrorBody;
        if (body.message) message = body.message;
      } catch {
        // response was not JSON
      }
      throw new ApiClientError('EXTRACT_FAILED', message, response.status);
    }
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) {
      return new Blob([blob], { type: 'image/png' });
    }
    return blob;
  }

  async processGarmentImage(file: File): Promise<ImageJobResponse> {
    const contentType =
      file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
    const upload = await this.createUploadUrl(
      { contentType, fileName: file.name },
      crypto.randomUUID()
    );
    await this.uploadBinary(upload.uploadUrl, file, upload.headers ?? { 'Content-Type': contentType });
    return this.createImageJob({ objectKey: upload.objectKey }, crypto.randomUUID());
  }

  async pollImageJob(
    jobId: string,
    onUpdate?: (job: ImageJobResponse) => void,
    timeoutMs = 45000
  ): Promise<ImageJobResponse> {
    const started = Date.now();
    let job = await this.getImageJob(jobId);
    onUpdate?.(job);
    while (Date.now() - started < timeoutMs) {
      const tagsDone = job.tagsStatus === 'succeeded' || job.tagsStatus === 'failed';
      const cutoutDone = job.cutoutStatus === 'succeeded' || job.cutoutStatus === 'failed';
      if (tagsDone && cutoutDone) return job;
      await new Promise((resolve) => setTimeout(resolve, 600));
      job = await this.getImageJob(jobId);
      onUpdate?.(job);
    }
    return job;
  }

  async uploadBinary(url: string, body: Blob, headers: Record<string, string>): Promise<void> {
    const requestHeaders = new Headers(headers);
    if (this.accessToken && url.startsWith(apiBaseUrl())) {
      requestHeaders.set('Authorization', `Bearer ${this.accessToken}`);
    }
    const response = await fetch(url, { method: 'PUT', headers: requestHeaders, body });
    if (!response.ok && response.status !== 204) {
      throw new ApiClientError('UPLOAD_FAILED', `Upload failed (${response.status})`, response.status);
    }
  }

  applyAuthResponse(response: AuthTokensResponse): void {
    this.accessToken = response.accessToken;
    setStoredRefreshToken(response.refreshToken);
    setStoredActiveProfileId(response.profile.id);
  }

  clearSession(): void {
    this.accessToken = null;
    clearStoredRefreshToken();
    clearStoredActiveProfileId();
  }

  private async request<T>(
    path: string,
    options: RequestInit & { skipAuth?: boolean; retryOnUnauthorized?: boolean } = {}
  ): Promise<T> {
    const { skipAuth = false, retryOnUnauthorized = true, ...init } = options;
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && typeof init.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }
    if (!skipAuth && this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    const response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers,
    });

    if (response.status === 401 && !skipAuth && retryOnUnauthorized) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        return this.request<T>(path, { ...options, retryOnUnauthorized: false });
      }
      this.clearSession();
      throw new ApiClientError('UNAUTHORIZED', 'Session expired', 401);
    }

    if (!response.ok) {
      let body: ApiErrorBody | null = null;
      try {
        body = (await response.json()) as ApiErrorBody;
      } catch {
        // ignore
      }
      throw new ApiClientError(
        body?.code ?? 'REQUEST_FAILED',
        body?.message ?? `Request failed (${response.status})`,
        response.status
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

export const apiClient = new ApiClient();
