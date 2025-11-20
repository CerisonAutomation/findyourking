interface MatchButtonsProps {
  onLike: () => void;
  onPass: () => void;
  isLoading?: boolean;
}

export default function MatchButtons({ onLike, onPass, isLoading = false }: MatchButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-8" role="group" aria-label="Match actions">
      <button
        onClick={onPass}
        disabled={isLoading}
        className="pass-button w-16 h-16 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        aria-label="Pass on this profile"
      >
        <svg
          className="w-8 h-8 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <button
        onClick={onLike}
        disabled={isLoading}
        className="like-button w-16 h-16 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        aria-label="Like this profile"
      >
        <svg
          className="w-8 h-8 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
