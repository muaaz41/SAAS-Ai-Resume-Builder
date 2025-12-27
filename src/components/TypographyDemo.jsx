import React from 'react';
import Typography from './Typography.jsx';

const TypographyDemo = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h1">Heading 1 (h1)</Typography>
      <Typography variant="h2">Heading 2 (h2)</Typography>
      <Typography variant="h3">Heading 3 (h3)</Typography>
      <Typography variant="h4">Heading 4 (h4)</Typography>
      <Typography variant="h5">Heading 5 (h5)</Typography>
      <Typography variant="h6">Heading 6 (h6)</Typography>
      
      <br />
      
      <Typography variant="subtitle1">Subtitle 1 - Medium weight body text</Typography>
      <Typography variant="subtitle2">Subtitle 2 - Medium weight smaller body text</Typography>
      
      <br />
      
      <Typography variant="body1">
        Body 1 - This is the primary body text. It uses the default font size (16px) 
        and regular font weight (400). This is suitable for most paragraph content.
      </Typography>
      
      <Typography variant="body2">
        Body 2 - This is secondary body text. It uses a smaller font size (14px) 
        and regular font weight (400). This is suitable for less important text.
      </Typography>
      
      <br />
      
      <Typography variant="button">Button Text</Typography>
      <br /><br />
      
      <Typography variant="caption">Caption Text</Typography>
      <br />
      
      <Typography variant="overline">Overline Text</Typography>
      
      <br /><br />
      
      <div className="text-h1">CSS Class: .text-h1</div>
      <div className="text-h2">CSS Class: .text-h2</div>
      <div className="text-h3">CSS Class: .text-h3</div>
      <div className="text-h4">CSS Class: .text-h4</div>
      <div className="text-h5">CSS Class: .text-h5</div>
      <div className="text-h6">CSS Class: .text-h6</div>
      
      <br />
      
      <div className="text-subtitle1">CSS Class: .text-subtitle1</div>
      <div className="text-subtitle2">CSS Class: .text-subtitle2</div>
      
      <br />
      
      <div className="text-body1">
        CSS Class: .text-body1 - This uses the CSS utility class instead of the component.
      </div>
      
      <div className="text-body2">
        CSS Class: .text-body2 - This also uses the CSS utility class.
      </div>
      
      <br />
      
      <div className="text-button">CSS Class: .text-button</div>
      <div className="text-caption">CSS Class: .text-caption</div>
      <div className="text-overline">CSS Class: .text-overline</div>
    </div>
  );
};

export default TypographyDemo;