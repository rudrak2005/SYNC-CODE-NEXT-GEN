import { useState } from "react";

export default function useConflictHandler() {
  const [conflict, setConflict] = useState(null);

  const openConflict = (projectState) => {
    setConflict(projectState);
  };

  const closeConflict = () => {
    setConflict(null);
  };

  return {
    conflict,
    openConflict,
    closeConflict
  };
}