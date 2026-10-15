import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { ImmortalButton } from './ImmortalComponents';
import { audioEngine } from './AudioEngine';

export interface ImmortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const ImmortalModal: React.FC<ImmortalModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        style={{
          backgroundImage: `var(--bg-card), var(--border-rim)`,
          backgroundOrigin: 'padding-box, border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: `0 24px 50px rgba(0, 0, 0, 0.95), var(--shadow-convex)`,
        }}
        className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-transparent p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-300">
              {title}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              audioEngine.playClick('button');
              onClose();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-1 text-sm text-zinc-300">{children}</div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
          {footer ? (
            footer
          ) : (
            <>
              <ImmortalButton variant="recessed" size="sm" onClick={onClose}>
                Cancel
              </ImmortalButton>
              <ImmortalButton
                variant="metallic"
                size="sm"
                onClick={() => {
                  audioEngine.playClick('metal');
                  onClose();
                }}
              >
                Confirm
              </ImmortalButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
