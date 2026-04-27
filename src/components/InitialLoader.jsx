import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * InitialLoader component with a timeout fallback.
 * If data hasn't loaded in 8 seconds, it displays an escape hatch to return to the hub.
 * @param {Function} onTimeoutExit - Callback to execute when the user clicks 'Return to Hub'.
 */
const InitialLoader = ({ onTimeoutExit }) => {
  const [takingTooLong, setTakingTooLong] = useState(false);

  useEffect(() => {
    // If the data hasn't loaded in 8 seconds, trigger the fallback UI
    const timer = setTimeout(() => {
      setTakingTooLong(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="animate-pulse font-black text-2xl text-blue-600 tracking-tighter">
        BIZ HUB
      </div>
      
      {takingTooLong && (
        <div className="mt-12 text-center animate-fade-in flex flex-col items-center px-6">
          <AlertTriangle className="text-orange-500 mb-3" size={32} />
          <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-6">
            The connection is taking longer than expected. The device may have been asleep too long.
          </p>
          <button 
            onClick={onTimeoutExit} // Pass handleExitToShopSelector here
            className="w-full max-w-[200px] py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-80 active:scale-95 transition-all shadow-sm"
          >
            Return to Hub
          </button>
        </div>
      )}
    </div>
  );
};

export default InitialLoader;
