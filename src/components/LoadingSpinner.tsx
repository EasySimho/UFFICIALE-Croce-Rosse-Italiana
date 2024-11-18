// src/components/LoadingSpinner.tsx
import { Loader2 } from 'lucide-react';

function LoadingSpinner() {
  return (
    <Loader2 className="animate-spin text-red-600 dark:text-red-400" size={24} />
  );
}

export default LoadingSpinner;