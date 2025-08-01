import React from 'react';
import { FaCheck } from 'react-icons/fa';
import '../styles/Approvebtn.css';

interface ApproveBtnProps {
  onClick: (e: React.MouseEvent) => void;
  size?: number;
  className?: string;
}

const ApproveBtn: React.FC<ApproveBtnProps> = ({ onClick, size = 13, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`approveButton ${className}`}
      aria-label="Approve"
    >
      <FaCheck size={size} color="#fff" />
    </button>
  );
};

export default ApproveBtn;