import { useCallback } from 'react';

// Simple translation hook - can be expanded with i18n library later
export function useTranslation() {
  const t = useCallback((key: string, options?: any) => {
    // For now, just return the key. In production, this would use a translation library
    return key;
  }, []);

  return { t };
}
