import { useState, useEffect } from 'react';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';

const Notification = ({ message, description, type = 'success', onClose }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 3000); // 3 giây
        return () => clearTimeout(timer);
    }, [onClose]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, 400); // thời gian đúng bằng animation
    };

    if (!isVisible) return null;

    const typeConfig = {
        success: {
            bg: 'bg-green-50 border-green-400 text-green-700',
            icon: <CheckCircleOutlined className="text-green-500 text-xl mr-4 mt-1" />,
        },
        error: {
            bg: 'bg-red-50 border-red-400 text-red-700',
            icon: <CloseCircleOutlined className="text-red-500 text-xl mr-4 mt-1" />,
        },
        info: {
            bg: 'bg-blue-50 border-blue-400 text-blue-700',
            icon: <InfoCircleOutlined className="text-blue-500 text-xl mr-4 mt-1" />,
        },
    };

    const { bg, icon } = typeConfig[type] || typeConfig.info;

    return (
        <div
            className={`fixed top-4 right-4 z-[9999] max-w-sm w-[340px] border-l-4 rounded-md shadow-md transition-all duration-500 ${isClosing ? 'animate-slide-out' : 'animate-slide-in'
                } ${bg}`}
        >
            <div className="flex items-start px-4 py-3">
                {icon}
                <div className="flex-1">
                    <h3 className="font-semibold mb-1">{message}</h3>
                    <p className="text-sm mx-2" style={{
                        marginLeft: "10px",
                        marginRight: "10px"
                    }}>{description}</p>
                </div>
                <button
                    onClick={handleClose}
                    className="ml-4 text-gray-400 hover:text-gray-600 transition"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default Notification;
