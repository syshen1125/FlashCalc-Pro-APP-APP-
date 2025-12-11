import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CalculationMode, Settings, FontSize, FontType, SoundType, Preset, User, UserRole } from '../types';
import { Play, Type, Upload, Check, Volume2, Music, Clock, Mic, Save, Trash2, FolderOpen, AlertTriangle, Layers, LogOut, Shield } from 'lucide-react';
import { injectCustomFont, getCustomFontName, STORAGE_KEY_DATA, STORAGE_KEY_NAME } from '../utils/fontUtils';
import { playBeep } from '../utils/sound';

interface Props {
  settings: Settings;
  onUpdate: (s: Settings) => void;
  onStart: () => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

const PRESETS_STORAGE_KEY = 'flashCalcPresets';

export const SettingsForm: React.FC<Props> = ({ settings, onUpdate, onStart, currentUser, onLogout, onOpenAdmin }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customFontName, setCustomFontName] = useState<string | null>(null);
  
  // Preset State
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState<string>('');
  const [presetGroup, setPresetGroup] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>(''); // Visual feedback for save
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  useEffect(() => {
    const savedName = getCustomFontName();
    if (savedName) setCustomFontName(savedName);

    // Load presets
    try {
      const savedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (savedPresets) {
        setPresets(JSON.parse(savedPresets));
      }
    } catch (e) {
      console.error("Failed to load presets", e);
    }
  }, []);

  // Compute grouped presets for dropdown
  const groupedPresets = useMemo(() => {
    const groups: Record<string, Preset[]> = {};
    presets.forEach(p => {
      const g = p.group || 'Uncategorized';
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    });
    // Sort keys
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name));
      return acc;
    }, {} as Record<string, Preset[]>);
  }, [presets]);

  // Get unique group names for datalist
  const existingGroups = useMemo(() => {
    const groups = new Set<string>();
    presets.forEach(p => {
      if (p.group) groups.add(p.group);
    });
    return Array.from(groups).sort();
  }, [presets]);
  
  const handleSavePreset = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!presetName.trim()) {
      alert("Please enter a name for the preset.");
      return;
    }

    const groupName = presetGroup.trim() || 'Uncategorized';
    const targetName = presetName.trim();

    let updatedPresets = [...presets];
    
    // Check if a preset with this name/group already exists
    const existingIndex = updatedPresets.findIndex(p => 
      p.name.toLowerCase() === targetName.toLowerCase() && 
      (p.group || 'Uncategorized').toLowerCase() === groupName.toLowerCase()
    );

    if (existingIndex >= 0) {
      const existingPreset = updatedPresets[existingIndex];
      
      // If we are updating the currently loaded preset, proceed without annoying confirmation
      // If we are overwriting a DIFFERENT preset (name collision), ask for confirmation
      if (existingPreset.id !== selectedPresetId) {
         if (!window.confirm(`Preset "${targetName}" in group "${groupName}" already exists. Overwrite?`)) {
           return;
         }
      }

      updatedPresets[existingIndex] = { 
        ...existingPreset, 
        settings: { ...settings }, 
        timestamp: Date.now() 
      };
      setSelectedPresetId(existingPreset.id);
    } else {
      // Create new preset
      const newPreset: Preset = {
        id: Date.now().toString(),
        name: targetName,
        group: groupName,
        settings: { ...settings },
        timestamp: Date.now(),
      };
      updatedPresets.push(newPreset);
      setSelectedPresetId(newPreset.id);
    }

    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    
    // Show temporary success feedback
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleLoadPreset = (id: string) => {
    setSelectedPresetId(id);
    if (!id) {
      setPresetName('');
      setPresetGroup('');
      return;
    }
    const preset = presets.find(p => p.id === id);
    if (preset) {
      setPresetName(preset.name);
      setPresetGroup(preset.group || '');
      // Merge to ensure backward compatibility if new fields were added to Settings since preset was saved
      onUpdate({ ...settings, ...preset.settings });
    }
  };

  const handleInitDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedPresetId) return;
    
    // Open Modal
    setDeleteConfirmationText('');
    setShowDeleteModal(true);
  };

  const executeDelete = () => {
    if (deleteConfirmationText.toLowerCase().trim() !== 'delete') {
      alert("Please type 'delete' correctly to confirm.");
      return;
    }

    const updatedPresets = presets.filter(p => p.id !== selectedPresetId);
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    
    // Reset UI
    setSelectedPresetId('');
    setPresetName('');
    setPresetGroup('');
    setShowDeleteModal(false);
  };

  const handleNumberChange = (field: keyof Settings, valueStr: string) => {
    let value = parseFloat(valueStr); // Changed to parseFloat to support decimal inputs for seconds
    if (isNaN(value)) return; 

    let newSettings = { ...settings };

    if (field === 'minDigits') {
      const valInt = parseInt(valueStr);
      const clamped = Math.max(1, Math.min(9, valInt));
      newSettings.minDigits = clamped;
      if (clamped > newSettings.maxDigits) newSettings.maxDigits = clamped;
    } 
    else if (field === 'maxDigits') {
      const valInt = parseInt(valueStr);
      const clamped = Math.max(1, Math.min(10, valInt));
      newSettings.maxDigits = clamped;
      if (clamped < newSettings.minDigits) newSettings.minDigits = clamped;
    }
    else if (field === 'numberCount') {
      newSettings.numberCount = Math.max(2, Math.min(50, parseInt(valueStr)));
    }
    else if (field === 'totalQuestions') {
      newSettings.totalQuestions = Math.max(1, Math.min(100, parseInt(valueStr)));
    }
    else if (field === 'answerDelaySeconds') {
      newSettings.answerDelaySeconds = Math.max(0, Math.min(60, parseInt(valueStr)));
    }
    else if (field === 'intervalSeconds') {
      // Allow finer control for speed
      newSettings.intervalSeconds = Math.max(0.01, Math.min(10.0, value));
    }
    else if (field === 'blankGapSeconds') {
      newSettings.blankGapSeconds = Math.max(0.0, Math.min(5.0, value));
    }
    else if (field === 'volume') {
      newSettings.volume = Math.max(0.0, Math.min(1.0, value));
    }

    onUpdate(newSettings);
  };

  const handleModeChange = (value: string) => {
    onUpdate({ ...settings, mode: value as CalculationMode });
  };

  const handleFontSizeChange = (value: string) => {
    onUpdate({ ...settings, fontSize: value as FontSize });
  };

  const handleFontTypeChange = (value: string) => {
    onUpdate({ ...settings, fontType: value as FontType });
  };

  const handleSoundTypeChange = (value: string) => {
    const newType = value as SoundType;
    onUpdate({ ...settings, soundType: newType });
    // Preview sound
    playBeep(1000, 0.1, settings.volume, newType);
  };

  const handleCountdownSoundTypeChange = (value: string) => {
    const newType = value as SoundType;
    onUpdate({ ...settings, countdownSoundType: newType });
    // Preview sound (lower pitch for countdown preview)
    playBeep(500, 0.15, settings.volume, newType);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
      alert("Please upload a valid font file (.ttf, .otf, .woff)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      try {
        localStorage.setItem(STORAGE_KEY_DATA, result);
        localStorage.setItem(STORAGE_KEY_NAME, file.name);
        injectCustomFont(result);
        setCustomFontName(file.name);
        onUpdate({ ...settings, fontType: FontType.CUSTOM });
      } catch (err) {
        console.error(err);
        alert("Failed to save font. The file might be too large for browser storage.");
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-y-auto max-h-[90vh] custom-scrollbar relative">
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 p-6 rounded-lg border border-red-500/50 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Delete Preset?</h3>
            </div>
            
            <p className="text-slate-300 mb-4 text-sm">
              This action cannot be undone. To confirm, please type <span className="font-mono font-bold text-white bg-slate-700 px-1 rounded">delete</span> below.
            </p>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Type delete"
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-red-500 outline-none mb-6"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white transition"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-2"
              >
                <Trash2 size={16} />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-slate-700 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            珠心算闪算系统
          </h1>
          <div className="flex items-center gap-3 mt-1">
             <span className="text-slate-400 text-sm">Professional Flash Calculation</span>
             {currentUser && (
               <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-cyan-300 border border-slate-600">
                 Logged in as: <strong>{currentUser.username}</strong>
               </span>
             )}
          </div>
        </div>
        
        <div className="flex gap-3 items-center w-full md:w-auto">
          {currentUser?.role === UserRole.ADMIN && (
             <button
              onClick={onOpenAdmin}
              className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-4 py-2 rounded-lg transition border border-purple-500/30"
              title="Admin Panel"
            >
              <Shield size={18} />
              <span className="hidden sm:inline">Users</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg transition"
            title="Logout"
          >
            <LogOut size={18} />
          </button>

          <button
            onClick={onStart}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-2 px-8 rounded-lg transform transition active:scale-95 shadow-lg shadow-green-500/20"
          >
            <Play size={24} fill="currentColor" />
            START
          </button>
        </div>
      </div>

      {/* PRESETS SECTION */}
      <div className="mb-8 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
        <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
          <FolderOpen size={18} />
          Configuration Presets (设置存档)
        </h3>
        
        <div className="flex flex-col gap-4">
          {/* Load Row */}
          <div className="w-full">
            <label className="block text-xs text-slate-500 mb-1">Load Existing Preset</label>
            <div className="relative">
              <select 
                value={selectedPresetId} 
                onChange={(e) => handleLoadPreset(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none appearance-none"
              >
                <option value="">-- Select a Preset to Load --</option>
                {Object.entries(groupedPresets).map(([group, groupPresets]) => (
                  <optgroup key={group} label={group}>
                    {groupPresets.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                <FolderOpen size={16} />
              </div>
            </div>
          </div>

          {/* Save/Edit Row */}
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs text-slate-500 mb-1">Preset Name</label>
              <input 
                type="text" 
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g. Level 1 Practice"
                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                 Group / Category
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  list="group-suggestions"
                  value={presetGroup}
                  onChange={(e) => setPresetGroup(e.target.value)}
                  placeholder="e.g. Beginners"
                  className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                />
                <Layers className="absolute right-3 top-2.5 text-slate-500 pointer-events-none" size={16} />
                <datalist id="group-suggestions">
                  {existingGroups.map(g => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto items-center">
              <button 
                onClick={handleSavePreset}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded transition shadow-lg shadow-blue-500/20"
              >
                <Save size={16} />
                Save
              </button>
               {saveStatus && (
                  <span className="text-green-400 font-bold text-sm animate-fade-in absolute -mt-10 md:mt-0 md:relative md:ml-0 whitespace-nowrap">
                    {saveStatus}
                  </span>
               )}
              <button 
                type="button"
                onClick={handleInitDelete}
                disabled={!selectedPresetId}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded transition ${!selectedPresetId ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' : 'bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800'}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Digits */}
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
          <h3 className="text-cyan-400 font-semibold mb-2">位数设置 (Digits)</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1">最小位数 (Min)</label>
            <input
              type="number"
              min={1}
              max={9}
              value={settings.minDigits}
              onChange={(e) => handleNumberChange('minDigits', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">最大位数 (Max)</label>
            <input
              type="number"
              min={settings.minDigits}
              max={10}
              value={settings.maxDigits}
              onChange={(e) => handleNumberChange('maxDigits', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
        </div>

        {/* Speed & Count */}
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
          <h3 className="text-purple-400 font-semibold mb-2">题目参数 (Parameters)</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1">口数 (Rows per Q)</label>
            <input
              type="number"
              min={2}
              max={50}
              value={settings.numberCount}
              onChange={(e) => handleNumberChange('numberCount', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              显示时间 (Display Time)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.1}
                max={3.0}
                step={0.1}
                value={settings.intervalSeconds}
                onChange={(e) => handleNumberChange('intervalSeconds', e.target.value)}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <input 
                type="number"
                min={0.01}
                max={5.0}
                step={0.01}
                value={settings.intervalSeconds}
                onChange={(e) => handleNumberChange('intervalSeconds', e.target.value)}
                className="w-20 bg-slate-700 border border-slate-600 rounded p-1 text-center text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <span className="text-xs text-slate-500">s</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              间隔时间 (Interval Gap)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.0}
                max={2.0}
                step={0.1}
                value={settings.blankGapSeconds}
                onChange={(e) => handleNumberChange('blankGapSeconds', e.target.value)}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
               <input 
                type="number"
                min={0.0}
                max={5.0}
                step={0.01}
                value={settings.blankGapSeconds}
                onChange={(e) => handleNumberChange('blankGapSeconds', e.target.value)}
                className="w-20 bg-slate-700 border border-slate-600 rounded p-1 text-center text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <span className="text-xs text-slate-500">s</span>
            </div>
          </div>
        </div>

        {/* Mode & Flow */}
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
          <h3 className="text-orange-400 font-semibold mb-2">模式设置 (Mode)</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1">题型 (Type)</label>
            <select
              value={settings.mode}
              onChange={(e) => handleModeChange(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value={CalculationMode.ALL_ADDITION}>全加 (All Addition)</option>
              <option value={CalculationMode.MIXED}>加减 (Mixed)</option>
              <option value={CalculationMode.ALTERNATING}>单加双混 (Odd Add/Even Mixed)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">写答时间 (Write Time)</label>
            <div className="flex items-center gap-2">
               <input
                type="number"
                min={0}
                max={60}
                value={settings.answerDelaySeconds}
                onChange={(e) => handleNumberChange('answerDelaySeconds', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <span className="text-xs text-slate-400">sec</span>
            </div>
          </div>
           <div>
            <label className="block text-sm text-slate-400 mb-1">总题数 (Total Qs)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.totalQuestions}
              onChange={(e) => handleNumberChange('totalQuestions', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>

        {/* Audio */}
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
          <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
            <Volume2 size={18} />
            声音设置 (Audio)
          </h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1">音量 (Volume)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={settings.volume}
                onChange={(e) => handleNumberChange('volume', e.target.value)}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <span className="w-8 text-right text-sm text-slate-300">{Math.round(settings.volume * 100)}%</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1 flex items-center gap-1">
               <Music size={14} />
               闪算音效 (Flash Sound)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[SoundType.CLASSIC, SoundType.DIGITAL, SoundType.SOFT, SoundType.SHARP].map((type) => (
                <button
                  key={type}
                  onClick={() => handleSoundTypeChange(type)}
                  className={`p-2 text-xs rounded border transition ${
                     settings.soundType === type
                     ? 'bg-green-600/50 border-green-500 text-white'
                     : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1 flex items-center gap-1">
               <Clock size={14} />
               倒计时音效 (Timer Sound)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[SoundType.CLASSIC, SoundType.DIGITAL, SoundType.SOFT, SoundType.SHARP].map((type) => (
                <button
                  key={type}
                  onClick={() => handleCountdownSoundTypeChange(type)}
                  className={`p-2 text-xs rounded border transition ${
                     settings.countdownSoundType === type
                     ? 'bg-green-600/50 border-green-500 text-white'
                     : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

           <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer p-2 bg-slate-700/50 rounded hover:bg-slate-700 transition">
                <input
                  type="checkbox"
                  checked={settings.enableAnswerAnnouncements}
                  onChange={(e) => onUpdate({ ...settings, enableAnswerAnnouncements: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 text-green-500 focus:ring-green-500 bg-slate-700 cursor-pointer"
                />
                <Mic size={14} />
                <span>倒计时语音提示 (Announce Remaining Time)</span>
              </label>
           </div>
        </div>

        {/* Display Settings */}
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg md:col-span-1 lg:col-span-2">
          <h3 className="text-pink-400 font-semibold mb-2 flex items-center gap-2">
            <Type size={18} />
            显示设置 (Display)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm text-slate-400 mb-2">字体大小 (Size)</label>
              <div className="grid grid-cols-4 gap-2">
                {[FontSize.SMALL, FontSize.MEDIUM, FontSize.LARGE, FontSize.HUGE].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleFontSizeChange(size)}
                    className={`p-2 rounded border transition text-sm font-bold ${
                      settings.fontSize === size
                        ? 'bg-pink-600/50 border-pink-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">字体类型 (Font)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                 {[FontType.MONO, FontType.SANS, FontType.SERIF, FontType.CURSIVE].map((font) => (
                  <button
                    key={font}
                    onClick={() => handleFontTypeChange(font)}
                    className={`p-2 rounded border transition text-sm ${
                      settings.fontType === font
                        ? 'bg-pink-600/50 border-pink-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                    }`}
                    style={{
                      fontFamily: 
                        font === FontType.MONO ? 'monospace' :
                        font === FontType.SERIF ? 'serif' :
                        font === FontType.CURSIVE ? 'cursive' : 'sans-serif'
                    }}
                  >
                    {font}
                  </button>
                ))}
                
                {/* Custom Font Button */}
                <button
                   onClick={() => {
                     if (customFontName) {
                       handleFontTypeChange(FontType.CUSTOM);
                     } else {
                       triggerFileUpload();
                     }
                   }}
                   className={`p-2 rounded border transition text-sm flex items-center justify-center gap-2 relative ${
                      settings.fontType === FontType.CUSTOM
                        ? 'bg-pink-600/50 border-pink-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                   }`}
                >
                   {settings.fontType === FontType.CUSTOM ? <Check size={14} /> : <Upload size={14} />}
                   {customFontName ? 'Custom' : 'Upload TTF'}
                </button>
              </div>

              {/* Upload Handler */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".ttf,.otf,.woff,.woff2" 
                className="hidden"
              />
              
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 h-6">
                {customFontName && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">Loaded: {customFontName}</span>
                    <button 
                      onClick={triggerFileUpload}
                      className="text-pink-400 hover:underline cursor-pointer"
                    >
                      (Change)
                    </button>
                  </div>
                )}
                {!customFontName && (
                  <span>No custom font uploaded.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
