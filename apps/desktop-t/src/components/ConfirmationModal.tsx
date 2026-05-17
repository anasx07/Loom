import { ShieldAlert } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  command: string;
  cwd: string;
  onAllow: () => void;
  onDeny: () => void;
}

export default function ConfirmationModal({
  isOpen,
  command,
  cwd,
  onAllow,
  onDeny
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in">
      <div className="w-[490px] bg-[#0b0c13]/95 border border-white/[0.08] rounded-[24px] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.8)] flex flex-col gap-6 animate-modal-scale">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/5">
            <ShieldAlert className="w-6 h-6 animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base font-extrabold text-white tracking-wide">
              Workspace Permission
            </h3>
            <p className="text-[11px] text-gray-400 font-semibold tracking-wide">
              An agent requires authorization to execute a sandbox tool.
            </p>
          </div>
        </div>

        <div className="bg-black/45 border border-white/[0.03] rounded-xl p-5 font-mono text-[11.5px] text-[#cbd5e1] leading-relaxed flex flex-col gap-2 max-h-[160px] overflow-y-auto">
          <div className="flex gap-2">
            <span className="text-gray-500">Operation:</span>
            <span className="text-white font-bold select-all">{command}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-gray-500">Directory:</span>
            <span className="text-violet-300 select-all">{cwd}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-gray-500">Boundary:</span>
            <span className="text-emerald-400 font-extrabold">SANDBOXED (RouteCode Secured)</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button 
            onClick={onDeny}
            className="px-5 py-2.5 border border-white/[0.04] hover:bg-white/[0.06] hover:text-white text-xs font-bold text-gray-400 rounded-xl transition-all duration-300 cursor-pointer"
          >
            Deny Run
          </button>
          <button 
            onClick={onAllow}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-black rounded-xl shadow-lg shadow-violet-600/15 hover:shadow-violet-600/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            Allow Action
          </button>
        </div>
      </div>
    </div>
  );
}
