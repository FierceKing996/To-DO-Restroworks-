import { useState, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    title: string;
    placeholder?: string;
    submitLabel?: string;
    icon?: React.ReactNode;
}

export default function InputModal({ isOpen, onClose, onSubmit, title, placeholder = '', submitLabel = 'Create', icon }: InputModalProps) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValue('');
            // Small delay to let the animation start, then focus
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

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

    const handleSubmit = () => {
        if (!value.trim()) return;
        onSubmit(value.trim());
        setValue('');
        onClose();
    };

    return (
        <div className="input-modal-overlay" onClick={onClose}>
            <div className="input-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Close button */}
                <button className="input-modal-close" onClick={onClose}>
                    <FiX size={18} />
                </button>

                {/* Header */}
                <div className="input-modal-header">
                    {icon && <div className="input-modal-icon">{icon}</div>}
                    <h3 className="input-modal-title">{title}</h3>
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    className="input-modal-input"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmit();
                    }}
                />

                {/* Actions */}
                <div className="input-modal-actions">
                    <button className="input-modal-btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="input-modal-btn-submit"
                        onClick={handleSubmit}
                        disabled={!value.trim()}
                    >
                        {submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
