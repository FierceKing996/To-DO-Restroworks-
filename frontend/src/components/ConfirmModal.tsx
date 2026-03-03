import { useEffect } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel'
}: ConfirmModalProps) {

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            return () => document.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="input-modal-overlay" onClick={onClose}>
            <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Close button */}
                <button className="input-modal-close" onClick={onClose}>
                    <FiX size={18} />
                </button>

                {/* Header */}
                <div className="input-modal-header">
                    <div className="confirm-modal-icon">
                        <FiAlertTriangle size={20} />
                    </div>
                    <h3 className="input-modal-title">{title}</h3>
                </div>

                {/* Message */}
                <p className="confirm-modal-message">{message}</p>

                {/* Actions */}
                <div className="input-modal-actions">
                    <button className="input-modal-btn-cancel" onClick={onClose}>
                        {cancelLabel}
                    </button>
                    <button
                        className="confirm-modal-btn-delete"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
