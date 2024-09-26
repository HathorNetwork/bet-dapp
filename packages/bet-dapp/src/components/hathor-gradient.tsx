import * as React from 'react';

export interface HathorGradientProps {
  text: React.ReactElement<any, any>;
}

const HathorGradient = ({ text }: HathorGradientProps) => {
  return (
    <span className="m-0 bg-gradient-to-r from-hathor-purple-500 from-10% to-hathor-green-400 to-50% text-transparent bg-clip-text">
      { text }
    </span>
  )
}

export { HathorGradient }