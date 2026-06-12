/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface TitleBarProps {
  title?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  isModal?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title = 'Impaciência.exe',
  onClose,
  onMinimize,
  onMaximize,
  isModal = false,
}) => {
  return (
    <div className="select-none flex items-center justify-between px-1 h-7 bg-[#000080] text-white font-sans text-xs sm:text-sm font-bold relative border-b border-black">
      {/* Top-Left Windows 3.1 Close Menu Control Box (thick horizontal pill) */}
      <div className="flex items-center shrink-0 z-10">
        {onClose ? (
          <button
            onClick={onClose}
            className="w-[18px] h-[16px] flex items-center justify-center bg-[#c0c0c0] text-black border-t-2 border-l-2 border-white border-b border-r border-[#606060] hover:bg-[#d5d5d5] active:border-t active:border-l active:border-black active:border-b-2 active:border-r-2 active:border-white focus:outline-none cursor-pointer"
            title="Fechar (Duplo clique)"
            onDoubleClick={onClose}
          >
            {/* The Windows 3.1-signature control menu drawer pill */}
            <div className="w-[10px] h-[4px] bg-black border-t border-b border-white shrink-0" />
          </button>
        ) : (
          <div className="w-[18px] h-[16px] bg-[#c0c0c0] border-t-2 border-l-2 border-white border-b border-r border-[#606060]" />
        )}
      </div>

      {/* Centered text - standard Windows 3.1 styling */}
      <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center pointer-events-none">
        <span className="truncate tracking-widest font-sans text-[11px] sm:text-[13px] font-extrabold select-none text-white text-center">
          {title.toUpperCase()}
        </span>
      </div>

      {/* Top-Right Windows 3.1 Control buttons: Down triangle and Up triangle */}
      <div className="flex items-center gap-[1px] z-10 shrink-0">
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="w-[18px] h-[16px] flex items-center justify-center font-extrabold text-[#000000] text-[9px] bg-[#c0c0c0] border-t-2 border-l-2 border-white border-b border-r border-[#606060] hover:bg-[#d5d5d5] active:border-t active:border-l active:border-black active:border-b-2 active:border-r-2 active:border-white focus:outline-none cursor-pointer"
            title="Minimizar"
          >
            ▼
          </button>
        )}
        {onMaximize && (
          <button
            onClick={onMaximize}
            className="w-[18px] h-[16px] flex items-center justify-center font-extrabold text-[#000000] text-[9px] bg-[#c0c0c0] border-t-2 border-l-2 border-white border-b border-r border-[#606060] hover:bg-[#d5d5d5] active:border-t active:border-l active:border-black active:border-b-2 active:border-r-2 active:border-white focus:outline-none cursor-pointer"
            title="Maximizar"
          >
            ▲
          </button>
        )}
      </div>
    </div>
  );
};
