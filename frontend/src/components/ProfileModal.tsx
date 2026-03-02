import { useState } from 'react';
import { FiX, FiShield } from 'react-icons/fi';
import { AuthService } from '../services/authService';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
}

export default function ProfileModal({ isOpen, onClose, username }: ProfileModalProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    if (!isOpen) return null;

    const handleApplyAdmin = async () => {
        setStatus('loading');
        try {
            const response = await fetch('http://localhost:5000/api/users/request-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthService.getToken()}`
                }
            });

            if (response.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">Your Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{username}</h3>
                            <p className="text-sm text-gray-500">Standard User</p>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-600 mt-1 flex-shrink-0">
                                <FiShield size={18} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-1">Super Admin Access</h4>
                                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                    Super Admins can manage all workspaces, invite users, and manage billing. 
                                    Applying will send a request directly to the founder for approval.
                                </p>
                                
                                {status === 'idle' && (
                                    <button 
                                        onClick={handleApplyAdmin}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-md transition-colors"
                                    >
                                        Apply for Super Admin
                                    </button>
                                )}
                                {status === 'loading' && <span className="text-xs text-blue-600 font-bold">Queuing request...</span>}
                                {status === 'success' && <span className="text-xs text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-md border border-green-200">✓ Request sent successfully!</span>}
                                {status === 'error' && <span className="text-xs text-red-600 font-bold">Failed to send request. Try again.</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}