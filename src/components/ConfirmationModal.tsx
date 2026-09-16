'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="text-danger w-6 h-6" />,
          iconBg: 'bg-danger/10 border-danger/20',
          btnBg: 'bg-danger text-white hover:bg-danger/90',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="text-warning w-6 h-6" />,
          iconBg: 'bg-warning/10 border-warning/20',
          btnBg: 'bg-warning text-black hover:bg-warning/90',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="text-success w-6 h-6" />,
          iconBg: 'bg-success/10 border-success/20',
          btnBg: 'bg-success text-white hover:bg-success/90',
        };
      default:
        return {
          icon: <Info className="text-primary w-6 h-6" />,
          iconBg: 'bg-primary/10 border-primary/20',
          btnBg: 'bg-primary text-white hover:bg-primary/90',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border flex items-center justify-center shrink-0 ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div className="flex-1 pr-4">
              <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/80 rounded-xl transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors ${styles.btnBg}`}
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
