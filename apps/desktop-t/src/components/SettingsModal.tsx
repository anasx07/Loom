import { useState } from "react";
import { 
  Settings, 
  Sliders, 
  KeyRound, 
  Shield, 
  Eye, 
  EyeOff
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: string;
  activeModel: string;
  apiKeys: Record<string, string>;
  onChangeProvider: (provider: string) => void;
  onChangeModel: (model: string) => void;
  onChangeApiKeys: (keys: Record<string, string>) => void;
  onSave: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  activeProvider,
  activeModel,
  apiKeys,
  onChangeProvider,
  onChangeModel,
  onChangeApiKeys,
  onSave
}: SettingsModalProps) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<"general" | "keys" | "sandbox">("general");
  const [visibleKeyProvider, setVisibleKeyProvider] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl flex items-center justify-center z-50 animate-fade-in">
      <div className="w-[720px] h-[550px] bg-[#0c0d14]/95 border border-white/[0.08] rounded-[24px] shadow-[0_32px_80px_rgba(0,0,0,0.8)] flex overflow-hidden animate-modal-scale">
        
        {/* Settings Navigation Column */}
        <div className="w-[200px] border-r border-white/[0.04] bg-black/20 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Settings className="w-4 h-4 text-violet-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="font-extrabold text-sm text-white tracking-wide">Workspace Settings</span>
          </div>
          
          <button
            onClick={() => setActiveSettingsTab("general")}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-xs text-left transition-all ${
              activeSettingsTab === "general"
                ? "bg-white/[0.04] text-violet-300 border border-white/[0.03]"
                : "text-gray-400 hover:bg-white/[0.02] hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-gray-500" /> Engine & Models
          </button>

          <button
            onClick={() => setActiveSettingsTab("keys")}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-xs text-left transition-all ${
              activeSettingsTab === "keys"
                ? "bg-white/[0.04] text-violet-300 border border-white/[0.03]"
                : "text-gray-400 hover:bg-white/[0.02] hover:text-white"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-gray-500" /> API Keys Ring
          </button>

          <button
            onClick={() => setActiveSettingsTab("sandbox")}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-xs text-left transition-all ${
              activeSettingsTab === "sandbox"
                ? "bg-white/[0.04] text-violet-300 border border-white/[0.03]"
                : "text-gray-400 hover:bg-white/[0.02] hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-gray-500" /> Boundary Rules
          </button>

          <div className="mt-auto p-3 bg-violet-955/20 border border-violet-800/20 rounded-xl text-[10px] text-violet-400 leading-relaxed font-medium">
            Workspace settings are persisted automatically to the global SDK JSON configuration.
          </div>
        </div>

        {/* Settings Configuration Frame */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-black/10">
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
            
            {/* General settings tab */}
            {activeSettingsTab === "general" && (
              <div className="flex flex-col gap-5 animate-fade-slide">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-extrabold text-white">Active AI Provider</h4>
                  <p className="text-[11px] text-gray-500">Choose the active AI provider used by the SDK orchestration engine.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {["anthropic", "openai", "openrouter", "deepseek", "google", "nvidia", "cloudflare-workers"].map(prov => (
                    <button
                      key={prov}
                      onClick={() => onChangeProvider(prov)}
                      className={`px-4 py-3 rounded-xl border text-xs font-bold text-left transition-all ${
                        activeProvider === prov
                          ? "bg-violet-500/10 border-violet-500/40 text-violet-300"
                          : "bg-[#0b0c12]/40 border-white/[0.03] text-gray-400 hover:bg-[#0b0c12]/80 hover:text-white"
                      }`}
                    >
                      <span className="capitalize">{prov.replace("-", " ")}</span>
                    </button>
                  ))}
                </div>

                <div className="h-px bg-white/[0.03] my-2" />

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Model Target Name</span>
                  <input
                    type="text"
                    value={activeModel}
                    onChange={e => onChangeModel(e.target.value)}
                    placeholder="e.g. claude-3-5-sonnet, gpt-4o, deepseek-coder"
                    className="w-full px-4 py-3 bg-[#0b0c12]/90 border border-white/[0.06] rounded-xl text-xs font-mono font-bold text-gray-200 outline-none focus:border-violet-500/40"
                  />
                </div>
              </div>
            )}

            {/* API Keys tab */}
            {activeSettingsTab === "keys" && (
              <div className="flex flex-col gap-5 animate-fade-slide">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-extrabold text-white">API Keys Ring</h4>
                  <p className="text-[11px] text-gray-500">API keys are stored securely inside RouteCode config.json and NEVER shared outside the sandbox.</p>
                </div>

                <div className="flex flex-col gap-3.5">
                  {Object.keys(apiKeys).map(prov => {
                    const isVisible = visibleKeyProvider === prov;
                    return (
                      <div key={prov} className="flex flex-col gap-1.5 p-3.5 bg-[#0b0c12]/30 border border-white/[0.03] rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold capitalize text-gray-300">{prov.replace("-", " ")}</span>
                          <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded ${
                            apiKeys[prov] 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {apiKeys[prov] ? "Configured" : "Missing"}
                          </span>
                        </div>
                        <div className="relative flex gap-2 mt-1">
                          <input
                            type={isVisible ? "text" : "password"}
                            value={apiKeys[prov] || ""}
                            onChange={e => {
                              const val = e.target.value;
                              onChangeApiKeys({
                                ...apiKeys,
                                [prov]: val
                              });
                            }}
                            placeholder={`Enter API Key for ${prov}...`}
                            className="flex-1 px-4 py-2.5 bg-[#0b0c12]/80 border border-white/[0.06] rounded-xl text-xs font-mono text-gray-200 outline-none focus:border-violet-500/30"
                          />
                          <button
                            type="button"
                            onClick={() => setVisibleKeyProvider(isVisible ? null : prov)}
                            className="px-3.5 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] rounded-xl text-gray-400 hover:text-white transition-colors"
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sandbox bounds tab */}
            {activeSettingsTab === "sandbox" && (
              <div className="flex flex-col gap-5 animate-fade-slide">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-extrabold text-white">Boundary Rules</h4>
                  <p className="text-[11px] text-gray-500">Configure safety boundaries for filesystem modifications and shell executions.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.02] rounded-2xl">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-extrabold text-gray-200">Interactive Shell Prompt</span>
                      <span className="text-[10px] text-gray-500">Always ask for permission before running any terminal commands.</span>
                    </div>
                    <div className="w-10 h-6 bg-violet-600 rounded-full flex items-center justify-end px-1 shadow shadow-violet-600/50">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.02] rounded-2xl opacity-60">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-extrabold text-gray-200">Filesystem Allowlist Bounds</span>
                      <span className="text-[10px] text-gray-500">Restrict agent workspace file writes strictly to workspace root bounds.</span>
                    </div>
                    <div className="w-10 h-6 bg-violet-600 rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.02] rounded-2xl opacity-60">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-extrabold text-gray-200">Auto-Bypass Safe Tools</span>
                      <span className="text-[10px] text-gray-500">Skip prompts for pure diagnostic tools (like 'ls', 'tree', or read operations).</span>
                    </div>
                    <div className="w-10 h-6 bg-[#181926] rounded-full flex items-center justify-start px-1 border border-white/[0.02]">
                      <div className="w-4 h-4 bg-gray-600 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Settings Footer Action Controls */}
          <div className="p-6 border-t border-white/[0.03] bg-black/10 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-white/[0.04] hover:bg-white/[0.06] hover:text-white text-xs font-bold text-gray-400 rounded-xl transition-all duration-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-black rounded-xl shadow-lg shadow-violet-600/15 hover:shadow-violet-600/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Save & Load Engine
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
