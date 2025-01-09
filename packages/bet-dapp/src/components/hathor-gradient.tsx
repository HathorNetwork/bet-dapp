import * as React from 'react';

export interface HathorGradientProps {
  text: React.ReactElement<any, any>;
}

const HathorGradient = ({ text }: HathorGradientProps) => {
  return (
    <span className="m-0 bg-gradient-to-r from-hathor-purple-500 from-10% to-[#FCB116] to-50% text-transparent bg-clip-text font-kuenstler">
      { text }
    </span>
  )
}

export { HathorGradient }
