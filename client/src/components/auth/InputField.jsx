import React from 'react';
import Input from '../ui/Input';

const InputField = ({ label, id, type = 'text', placeholder, register, error }) => {
  return (
    <div className="w-full flex justify-center flex-col relative pb-5">
      <Input 
        label={label} 
        id={id} 
        type={type} 
        placeholder={placeholder} 
        {...register(id)} 
        // Inline CSS dynamic injection to mutate the visual state on validation failure
        className={`w-full ${error ? '!border-red-900/50 focus:!ring-red-900 bg-red-950/10' : ''}`}
      />
      {error && (
        <span className="text-red-500/80 text-xs font-medium absolute bottom-0 left-0">
          {error.message}
        </span>
      )}
    </div>
  );
};

export default InputField;
