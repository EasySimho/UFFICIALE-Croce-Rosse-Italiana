// src/components/Loader.tsx
import Logo from "../public/Emblema_CRI.svg";

export function Loader() {
  return (
    <div className="fixed inset-0 bg-red-600 flex items-center justify-center">
      <div className="animate-pulse">
        <img 
          src={Logo} 
          alt="CRI Logo" 
          className="w-32 h-32" 
        />
      </div>
    </div>
  );
}