'use client';

import { useState, useCallback } from 'react';
import { callProcessCard, callProcessVoice, callAIQuery } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import type { OCRResult, VoiceStructuredData } from '@/lib/types';

interface UseAIReturn {
  isProcessing: boolean;
  error: string | null;
  processBusinessCard: (
    photoLocalId: string,
    photoStoragePath: string,
    supplierLocalId: string
  ) => Promise<OCRResult | null>;
  processVoiceNote: (
    voiceNoteLocalId: string,
    transcript: string,
    supplierLocalId: string
  ) => Promise<VoiceStructuredData | null>;
  askQuestion: (question: string, supplierData?: object[], context?: string) => Promise<string | null>;
}

/**
 * Hook for AI operations (OCR, voice processing, queries).
 */
export function useAI(): UseAIReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useAppStore((state) => state.isOnline);

  const processBusinessCard = useCallback(
    async (
      photoLocalId: string,
      photoStoragePath: string,
      supplierLocalId: string
    ): Promise<OCRResult | null> => {
      if (!isOnline) {
        setError('Cannot process while offline');
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await callProcessCard(photoLocalId, photoStoragePath, supplierLocalId);
        if (result?.success && result.ocr_result) {
          return result.ocr_result as OCRResult;
        }
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process business card';
        setError(message);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [isOnline]
  );

  const processVoiceNote = useCallback(
    async (
      voiceNoteLocalId: string,
      transcript: string,
      supplierLocalId: string
    ): Promise<VoiceStructuredData | null> => {
      if (!isOnline) {
        setError('Cannot process while offline');
        return null;
      }

      if (!transcript.trim()) {
        setError('No transcript to process');
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await callProcessVoice(voiceNoteLocalId, transcript, supplierLocalId);
        if (result?.success && result.structured_data) {
          return result.structured_data as VoiceStructuredData;
        }
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process voice note';
        setError(message);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [isOnline]
  );

  const askQuestion = useCallback(
    async (question: string, supplierData?: object[], context?: string): Promise<string | null> => {
      if (!isOnline) {
        setError('Cannot query while offline');
        return null;
      }

      if (!question.trim()) {
        setError('Please enter a question');
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const answer = await callAIQuery(question, supplierData, context);
        return answer;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get answer';
        setError(message);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [isOnline]
  );

  return {
    isProcessing,
    error,
    processBusinessCard,
    processVoiceNote,
    askQuestion,
  };
}
