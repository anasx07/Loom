import React from "react";
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  Lock, 
  Terminal, 
  Trash2, 
  Sparkles
} from "lucide-react";

interface SidebarProps {
  sessions: string[];
  activeSession: string;
  onSelectSession: (name: string) => void;
  onNewSession: () => void;
  onDeleteSession: (name: string, e: React.MouseEvent) => void;
  activeProvider: string;
  activeModel: string;
  isOpen: boolean;
  isTauri: boolean;
  onOpenSettings: () => void;
}

export default function Sidebar({
  sessions,
  activeSession,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  activeProvider,
  activeModel,
  isOpen,
  isTauri,
  onOpenSettings
}: SidebarProps) {
  return (
    <aside 
      className={`relative z-10 flex flex-col h-full bg-black/25 border-r border-white/[0.04] backdrop-blur-3xl transition-all duration-300 ${
        isOpen ? "w-[290px]" : "w-0 -translate-x-full"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-6 border-b border-white/[0.03]">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 shadow-md shadow-violet-500/10">
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-wider bg-gradient-to-r from-violet-300 via-indigo-200 to-fuchsia-300 bg-clip-text text-transparent uppercase">
            RouteCode
          </span>
          <span className="text-[9px] font-bold text-gray-500 tracking-widest uppercase">
            Studio Workspace
          </span>
        </div>
        <span className="ml-auto text-[8px] font-black tracking-widest text-[#d946ef] bg-[#d946ef]/10 border border-[#d946ef]/20 rounded-md px-1.5 py-0.5 uppercase">
          {isTauri ? "Native" : "Web"}
        </span>
      </div>

      {/* Scrollable Sidebar Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <button 
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/15 hover:shadow-violet-600/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> New Session
        </button>

        {/* Sessions List */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">
            Active Sessions
          </span>
          <div className="flex flex-col gap-1.5">
            {sessions.map(s => {
              const isActive = activeSession === s;
              return (
                <button
                  key={s}
                  onClick={() => onSelectSession(s)}
                  className={`group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-xs text-left transition-all duration-300 cursor-pointer border ${
                    isActive
                      ? "bg-white/[0.03] border-white/[0.04] text-violet-300 before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-gradient-to-b before:from-violet-500 before:to-fuchsia-500 before:rounded-full"
                      : "bg-transparent border-transparent text-gray-400 hover:bg-white/[0.02] hover:text-white"
                  }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 ${isActive ? "text-violet-400" : "text-gray-500"}`} />
                  <span className="truncate flex-1">{s}</span>
                  {sessions.length > 1 && (
                    <Trash2 
                      onClick={(e) => onDeleteSession(s, e)}
                      className="w-3.5 h-3.5 text-gray-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-auto"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secure Environment Indicators */}
        <div className="flex flex-col gap-3 mt-auto">
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">
            Security Boundary
          </span>
          <div className="flex flex-col gap-2 p-4 bg-white/[0.01] border border-white/[0.02] rounded-2xl">
            <div className="flex items-center gap-3 text-emerald-400 text-xs font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <Lock className="w-3.5 h-3.5 text-emerald-400/80" />
              <span>Filesystem Secured</span>
            </div>
            <div className="h-px bg-white/[0.03] my-1" />
            <div className="flex items-center gap-3 text-emerald-400 text-xs font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <Terminal className="w-3.5 h-3.5 text-emerald-400/80" />
              <span>Shell Sandbox Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/[0.03] flex flex-col gap-4 bg-black/10">
        <div className="flex flex-col gap-1 px-2">
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
            Active Provider
          </span>
          <span className="text-xs font-bold text-violet-400 truncate">
            {activeProvider} ({activeModel})
          </span>
        </div>
        <button 
          onClick={onOpenSettings}
          className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.06] text-xs font-bold text-gray-300 rounded-xl transition-all duration-300 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-gray-400" /> Settings Panel
        </button>
      </div>
    </aside>
  );
}
