import React from 'react';
import { Toaster } from 'sonner';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster 
        position="top-right"
        expand={false}
        richColors
        closeButton
      />
    </>
  );
};