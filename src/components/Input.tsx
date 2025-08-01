import React from 'react';
// import '../styles/form.css';

interface InputProps {
  label: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  width?: string | number;
  required?: true;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, value, onChange, placeholder, type = 'text', width, required }, ref) => (
    <div className="input-container">
      <label className="form-label">{label}</label>
      <input
        className="form-control"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={width ? { width } : {}}
        required={required}
        ref={ref}
      />
    </div>
  )
);

export default Input; 