import React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full max-w-6xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

interface DialogContentProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export const DialogContent: React.FC<DialogContentProps> = ({ children, onClose }) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      {children}
    </div>
  );
};

interface DialogHeaderProps {
  children: React.ReactNode;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children }) => {
  return (
    <div className="px-6 py-4 border-b border-gray-700">
      {children}
    </div>
  );
};

interface DialogTitleProps {
  children: React.ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ children }) => {
  return (
    <h2 className="text-xl font-semibold text-hathor-yellow-500">
      {children}
    </h2>
  );
};

interface DialogBodyProps {
  children: React.ReactNode;
}

export const DialogBody: React.FC<DialogBodyProps> = ({ children }) => {
  return (
    <div className="p-6">
      {children}
    </div>
  );
};
