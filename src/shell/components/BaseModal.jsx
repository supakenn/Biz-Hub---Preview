import { X } from "lucide-react";

/**
 * BaseModal Template
 * 
 * A standardized modal wrapper that ensures all popups across the entire Biz Hub 
 * ecosystem share the exact same spacing, border-radius, background coloring, 
 * animations, and close-button behavior.
 * 
 * Props:
 * - isOpen (bool): Whether the modal is visible
 * - onClose (function): Callback when the close button or backdrop is clicked
 * - title (string | node): The title text or element shown in the header
 * - icon (IconComponent): Optional Lucide react icon to display next to the title
 * - iconColor (string): Tailwind text color class for the icon (e.g. "text-blue-500")
 * - maxWidth (string): Tailwind max-width class (default: "max-w-md")
 * - children (node): The main content of the modal
 * - footer (node): Optional fixed footer content (buttons, etc.)
 */
export default function BaseModal({ 
  isOpen, 
  onClose, 
  title, 
  icon: Icon, 
  iconColor = "text-blue-500",
  maxWidth = "max-w-md", 
  children,
  footer 
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6" 
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full ${maxWidth} flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-gray-800`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-900 p-4 sm:p-5 text-white flex justify-between items-center shrink-0 shadow-md border-b-4 border-blue-500 relative">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="bg-gray-800 p-2 rounded-xl shadow-inner border border-gray-700">
                <Icon size={20} className={iconColor} />
              </div>
            )}
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight line-clamp-1">
              {title}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-gray-50 dark:bg-gray-950 custom-scrollbar text-gray-800 dark:text-gray-200">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
