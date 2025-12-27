import React from 'react';

const Typography = ({ variant = 'body1', children, className = '', component, ...props }) => {
  const variantMap = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    body1: 'p',
    body2: 'p',
    subtitle1: 'p',
    subtitle2: 'p',
    button: 'span',
    caption: 'span',
    overline: 'span',
  };

  const Component = component || variantMap[variant] || 'span';
  
  const variantClasses = {
    h1: 'text-h1',
    h2: 'text-h2',
    h3: 'text-h3',
    h4: 'text-h4',
    h5: 'text-h5',
    h6: 'text-h6',
    body1: 'text-body1',
    body2: 'text-body2',
    subtitle1: 'text-subtitle1',
    subtitle2: 'text-subtitle2',
    button: 'text-button',
    caption: 'text-caption',
    overline: 'text-overline',
  };

  const baseClasses = variantClasses[variant] || '';
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <Component className={combinedClasses} {...props}>
      {children}
    </Component>
  );
};

export default Typography;