import React from 'react';
// import '../styles/inputtype.css';

interface Option {
  label: string;
  value: string;
  disabled?:boolean;
}

interface FormInputTypeProps {
  label: string;
  name: string;
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  disabled:boolean;
  width?: string | number;
}

const FormInputType: React.FC<FormInputTypeProps> = ({ label, name, id = name, value, onChange, options,disabled,width }) => {
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <select id={id} name={name} className="form-control" value={value} onChange={onChange} style={width ? { width } : {}}>
        {/* <option value="">Select</option> */}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}  disabled={disabled}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

export default FormInputType;