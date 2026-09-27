import * as React from 'react';
import { cn } from '@/lib/utils';
import { Editor } from './editor';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, placeholder, disabled, ...props }, ref) => {
    return (
      <div className={cn("w-full", className)}>
        <Editor
          value={(value as string) || ''}
          onChange={(val) => {
            if (onChange) {
              const event = {
                target: { value: val },
                currentTarget: { value: val },
              } as React.ChangeEvent<HTMLTextAreaElement>;
              onChange(event);
            }
          }}
          placeholder={placeholder || ''}
          editable={!disabled}
        />
        <textarea
          style={{ display: 'none' }}
          ref={ref}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
