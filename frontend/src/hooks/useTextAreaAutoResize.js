import { useEffect } from 'react';

export const useTextAreaAutoResize = (textareaRef, value) => {
  useEffect(() => {
    if (!textareaRef.current) return;

    const adjustHeight = () => {
      const element = textareaRef.current;
      element.style.height = 'auto';
      const newHeight = Math.min(element.scrollHeight, 5 * 24); // 최대 5줄
      element.style.height = `${newHeight}px`;
    };

    adjustHeight();
  }, [value]);

  return {
    adjustHeight: (element) => {
      element.style.height = 'auto';
      const newHeight = Math.min(element.scrollHeight, 5 * 24);
      element.style.height = `${newHeight}px`;
    }
  };
}; 