import React from 'react';
// import '../styles/form.css';

interface Option {
  label: string;
  value: string;
  // name:string;
}

interface DropInputProps {
  label: string;
  value: string;
  // name:string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  width?: string | number;
}

const DropInput = React.forwardRef<HTMLSelectElement, DropInputProps>(
  ({ label, value, onChange, options, width }, ref) => (
    <div className="form-group">
      <label className='form-label'>{label}</label>
      <select
        className="form-select"
        value={value}
        onChange={onChange}
        style={width ? { width } : {}}
        ref={ref}
      >
        <option value="" disabled>Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
);

export default DropInput; 