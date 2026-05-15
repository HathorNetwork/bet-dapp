import * as React from 'react';

export interface HathorGradientProps {
  text: React.ReactElement<any, any>;
}

const HathorGradient = ({ text }: HathorGradientProps) => {
  return (
    <span className="m-0 text-[#FCB116] font-kuenstler">
      { text }
    </span>
  )
}

export { HathorGradient }
