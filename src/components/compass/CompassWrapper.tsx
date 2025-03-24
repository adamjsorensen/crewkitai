
import React from 'react';
import CompassGuide from './CompassGuide';

interface CompassWrapperProps {
  children: React.ReactNode;
}

const CompassWrapper: React.FC<CompassWrapperProps> = ({ children }) => {
  return (
    <>
      <CompassGuide />
      {children}
    </>
  );
};

export default CompassWrapper;
