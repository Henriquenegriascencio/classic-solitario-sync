/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface WindowsModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  widthClass?: string;
  children: React.ReactNode;
}

export const WindowsModal: React.FC<WindowsModalProps> = ({
  title,
  isOpen,
  onClose,
  widthClass = 'max-w-xs sm:max-w-md w-full',
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[300] select-none antialiased">
      {/* 3D Beveled Windows 95 Dialog Window */}
      <div 
        className={`bg-[#c0c0c0] text-black border-2 border-t-white border-l-white border-b-black border-r-black p-0.5 flex flex-col max-h-[85vh] ${widthClass} overflow-hidden shadow-2xl relative`}
        style={{
          boxShadow: '1px 1px 0 #000, inset 1px 1px 0 #fff, inset -1.5px -1.5px 0 #808080, 2px 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        {/* Modal Window Header */}
        <div className="bg-[#000080] text-white h-5 px-1.5 flex items-center justify-between shrink-0 font-sans font-bold text-xs select-none">
          <span className="truncate tracking-wide text-[11px] font-extrabold">
            {title.toUpperCase()}
          </span>
          <button
            onClick={onClose}
            className="w-4.5 h-3.5 bg-[#c0c0c0] text-black border border-t-white border-l-white border-b-stone-800 border-r-stone-800 active:border-t-stone-800 active:border-l-stone-800 active:border-b-white active:border-r-white flex items-center justify-center font-bold text-[9px] cursor-pointer focus:outline-none"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Modal Window Inner Content Bevel */}
        <div className="p-3.5 flex flex-col gap-3.5 overflow-hidden flex-1 min-h-0">
          {/* Main content body inside */}
          <div className="overflow-y-auto flex-1 pr-1 custom-vintage-scrollbar font-sans text-xs">
            {children}
          </div>

          {/* Modal Footer / OK button */}
          <div className="flex justify-end gap-2 shrink-0 pt-2.5 border-t border-t-[#808080] border-b-white">
            <button
              onClick={onClose}
              className="px-5 py-1 min-w-[75px] bg-[#c0c0c0] text-black font-sans font-semibold text-xs border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-neutral-200 focus:outline-none cursor-pointer transition-none"
              style={{
                boxShadow: 'inset 1px 1px 0 #fff'
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
