import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/api/client';
import { useAuthSession } from '@/auth/AuthSessionContext';
import { localCutout, localQuickTags } from '@/imageJobs/localFallback';
import type { ImageTags } from '@/imageJobs/tags';
import { canvasFromImageUrl, looksLikeMultipleGarments } from '@/imageProcessing/regions';
import { useImageStorage } from '@/images';

export interface GarmentPhotoState {
  previewUrl?: string;
  originalUrl?: string;
  jobId?: string;
  tags?: ImageTags;
  tagsStatus: 'idle' | 'queued' | 'running' | 'succeeded' | 'failed';
  cutoutStatus: 'idle' | 'queued' | 'running' | 'succeeded' | 'failed';
  error?: string;
  needsCrop: boolean;
  cropConfirmed: boolean;
  reviewOpen: boolean;
}

const idleState = (): GarmentPhotoState => ({
  tagsStatus: 'idle',
  cutoutStatus: 'idle',
  needsCrop: false,
  cropConfirmed: false,
  reviewOpen: false,
});

async function detectNeedsCrop(url: string | undefined, hinted?: boolean): Promise<boolean> {
  if (hinted) return true;
  if (!url) return false;
  try {
    const canvas = await canvasFromImageUrl(url);
    return looksLikeMultipleGarments(canvas);
  } catch {
    return false;
  }
}

export function useGarmentPhoto() {
  const { authProvider } = useAuthSession();
  const imageStorage = useImageStorage();
  const [state, setState] = useState<GarmentPhotoState>(idleState);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const applyTags = useCallback((tags?: ImageTags | null) => {
    if (!tags) return;
    setState((prev) => ({
      ...prev,
      tags,
    }));
  }, []);

  const finishCutout = useCallback(async (url: string, hinted?: boolean) => {
    const needsCrop = await detectNeedsCrop(url, hinted);
    setState((prev) => ({
      ...prev,
      previewUrl: url,
      cutoutStatus: 'succeeded',
      needsCrop,
      cropConfirmed: !needsCrop,
      reviewOpen: needsCrop,
    }));
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setState({
        ...idleState(),
        previewUrl: objectUrl,
        originalUrl: objectUrl,
        tagsStatus: 'queued',
        cutoutStatus: 'queued',
      });

      if (authProvider.id === 'api') {
        try {
          const job = await apiClient.processGarmentImage(file);
          setState((prev) => ({
            ...prev,
            jobId: job.id,
            originalUrl: job.originalUrl ?? prev.originalUrl,
            previewUrl: job.processedUrl ?? job.originalUrl ?? prev.previewUrl,
            tags: (job.tags as ImageTags | undefined) ?? prev.tags,
            tagsStatus: job.tagsStatus,
            cutoutStatus: job.cutoutStatus,
          }));
          const done =
            job.tagsStatus === 'succeeded' && job.cutoutStatus === 'succeeded'
              ? job
              : await apiClient.pollImageJob(job.id, (next) => {
                  setState((prev) => ({
                    ...prev,
                    tags: (next.tags as ImageTags | undefined) ?? prev.tags,
                    tagsStatus: next.tagsStatus,
                    cutoutStatus: next.cutoutStatus,
                    previewUrl: next.processedUrl ?? next.originalUrl ?? prev.previewUrl,
                    originalUrl: next.originalUrl ?? prev.originalUrl,
                    error: next.errorMessage ?? undefined,
                  }));
                });
          setState((prev) => ({
            ...prev,
            tags: (done.tags as ImageTags | undefined) ?? prev.tags,
            tagsStatus: done.tagsStatus,
            cutoutStatus: done.cutoutStatus,
            originalUrl: done.originalUrl ?? prev.originalUrl,
            error: done.errorMessage ?? undefined,
          }));
          if (done.cutoutStatus === 'succeeded' && (done.processedUrl || objectUrl)) {
            await finishCutout(done.processedUrl ?? objectUrl, done.needsReview === true);
          } else if (done.cutoutStatus === 'failed') {
            setState((prev) => ({ ...prev, cutoutStatus: 'failed' }));
          }
        } catch (err) {
          try {
            const tags = await localQuickTags(file);
            applyTags(tags);
            const cutout = await localCutout(file);
            const stored = await imageStorage.upload(cutout.url);
            setState((prev) => ({
              ...prev,
              tags,
              tagsStatus: 'succeeded',
              error: err instanceof Error ? err.message : undefined,
            }));
            await finishCutout(stored.url, cutout.needsCrop);
          } catch {
            setState((prev) => ({
              ...prev,
              tagsStatus: 'failed',
              cutoutStatus: 'failed',
              error: err instanceof Error ? err.message : 'Could not process image',
            }));
          }
        }
        return;
      }

      void localQuickTags(file).then((tags) => {
        applyTags(tags);
        setState((prev) => ({ ...prev, tagsStatus: 'succeeded', tags }));
      });
      try {
        const cutout = await localCutout(file);
        const stored = await imageStorage.upload(cutout.url);
        await finishCutout(stored.url, cutout.needsCrop);
      } catch {
        setState((prev) => ({ ...prev, cutoutStatus: 'failed' }));
      }
    },
    [applyTags, authProvider.id, finishCutout, imageStorage]
  );

  const openReview = useCallback(() => {
    setState((prev) => ({ ...prev, reviewOpen: true }));
  }, []);

  const closeReview = useCallback(() => {
    setState((prev) => ({ ...prev, reviewOpen: false }));
  }, []);

  const confirmCrop = useCallback((dataUrl: string) => {
    setState((prev) => ({
      ...prev,
      previewUrl: dataUrl,
      needsCrop: false,
      cropConfirmed: true,
      reviewOpen: false,
    }));
  }, []);

  const clear = useCallback(() => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setState(idleState());
  }, []);

  return { state, processFile, clear, openReview, closeReview, confirmCrop };
}
