import { useEffect } from "react";

export const useToast = () => {
  const toast = ({ title, description }) => {
    alert(`${title}\n\n${description}`);
  };

  return { toast };
};
