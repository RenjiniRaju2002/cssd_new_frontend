import React from 'react';
// import '../styles/form.css';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  width?: string | number;
  min?: string;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, value, onChange, width, min }, ref) => (
  <div className="dateinput-container">
    <label className="form-label">{label}</label>
    <input
      className="form-control"
      type="date"
      value={value}
      onChange={onChange}
      style={width ? { width } : {}}
        ref={ref}
        min={min}
    />
  </div>
  )
);

export default DateInput; 