import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, FileText, Lock, Sun, Moon, Music, Volume2, VolumeX, Eye, EyeOff, Shield,
  Download, Upload, Maximize2, Minimize2, Clock, BarChart3, Copy, Check, Zap,
  FileCode, Sparkles, RefreshCw, Settings, Keyboard, BookOpen, Target, Trash2,
  Save, History, Moon as MoonIcon, Sun as SunIcon, Palette, Info
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';

interface NoteStats {
  characters: number;
  words: number;
  lines: number;
  paragraphs: number;
  readingTime: number;
  sentences: number;
}

interface Theme {
  name: string;
  bg: string;
  text: string;
  secondary: string;
  border: string;
  accent: string;
  gradient: string;
}

const themes: Theme[] = [
  {
    name: 'Purple Dream',
    bg: 'bg-[#1e1e1e]',
    text: 'text-[#d4d4d4]',
    secondary: 'bg-[#252526]',
    border: 'border-[#333333]',
    accent: 'from-purple-500 to-pink-500',
    gradient: 'from-purple-500/10 to-pink-500/10'
  },
  {
    name: 'Ocean Blue',
    bg: 'bg-[#0a192f]',
    text: 'text-[#ccd6f6]',
    secondary: 'bg-[#112240]',
    border: 'border-[#1e3a5f]',
    accent: 'from-cyan-500 to-blue-500',
    gradient: 'from-cyan-500/10 to-blue-500/10'
  },
  {
    name: 'Forest Green',
    bg: 'bg-[#0d1b2a]',
    text: 'text-[#e0e1dd]',
    secondary: 'bg-[#1b263b]',
    border: 'border-[#2d4356]',
    accent: 'from-emerald-500 to-teal-500',
    gradient: 'from-emerald-500/10 to-teal-500/10'
  },
  {
    name: 'Sunset Orange',
    bg: 'bg-[#1a1a1a]',
    text: 'text-[#f5f5f5]',
    secondary: 'bg-[#2d2d2d]',
    border: 'border-[#404040]',
    accent: 'from-orange-500 to-red-500',
    gradient: 'from-orange-500/10 to-red-500/10'
  },
  {
    name: 'Cherry Blossom',
    bg: 'bg-[#1a1625]',
    text: 'text-[#f0e6f6]',
    secondary: 'bg-[#2a1f3d]',
    border: 'border-[#4a3a5e]',
    accent: 'from-pink-400 to-rose-500',
    gradient: 'from-pink-400/10 to-rose-500/10'
  },
  {
    name: 'Neon Night',
    bg: 'bg-[#0f0f23]',
    text: 'text-[#e0e0ff]',
    secondary: 'bg-[#1a1a3e]',
    border: 'border-[#2e2e5e]',
    accent: 'from-violet-500 to-fuchsia-500',
    gradient: 'from-violet-500/10 to-fuchsia-500/10'
  }
];

const musicTracks = [
  { name: 'Nhạc Tết 2026', url: '/music/YTSave.com_YouTube_TOP-30-Nhac-Tet-Remix-Ngay-Xuan-TET-LA-T_Media_bufdli1rvGM_007_48k.mp3' },
  { name: 'Lo-fi Chill', url: '/music/YTSave.com_YouTube_Nhac-Chill-2026-BXH-Nhac-Chill-TikTok-Tr_Media_Fo1QxvMKOSo_007_48k.mp3' },
  { name: 'Nhạc Remix', url: '/music/YTSave.com_YouTube_TOP-30-Nhac-Remix-Gay-Bao-TikTok-2025-Co_Media_EtognbZFfqA_007_48k.mp3' },
  { name: 'Vol 6', url: '/music/YTSave.com_YouTube_Nhac-Di-Tam-vol6_Media_rB00C8f1ux8_006_48k.mp3' },
  { name: 'Nonstop 2026', url: '/music/YTSave.com_YouTube_NHAC-REMIX-TIKTOK-HAY-2026-NONSTOP-2026_Media_KxRee7LmM8A_007_48k.mp3' },
  { name: 'Dj Thái Hoàng', url: '/music/YTSave.com_YouTube_NHAC-REMIX-TIKTOK-HAY-2026-NONSTOP-2026_Media_8mIc4u9jKhI_007_48k.mp3' },

];

export default function App() {
  const [content, setContent] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Password protection
  const [isLocked, setIsLocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate stats
  const stats: NoteStats = useMemo(() => {
    const trimmedContent = content.trim();
    const words = trimmedContent ? trimmedContent.split(/\s+/).filter(w => w.length > 0).length : 0;
    const characters = content.length;
    const lines = content ? content.split('\n').length : 1;
    const paragraphs = trimmedContent ? trimmedContent.split(/\n\n+/).filter(p => p.length > 0).length : 0;
    const sentences = trimmedContent ? trimmedContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
    const readingTime = Math.ceil(words / 200); // 200 WPM average
    
    return { characters, words, lines, paragraphs, readingTime, sentences };
  }, [content]);

  // Line numbers array
  const lineNumbers = useMemo(() => {
    return Array.from({ length: Math.max(stats.lines, 20) }, (_, i) => i + 1);
  }, [stats.lines]);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio(musicTracks[currentTrack].url);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    // Load saved data
    const savedNote = localStorage.getItem('anhtu-note-encrypted');
    const savedPassword = localStorage.getItem('anhtu-note-password');
    const savedTheme = localStorage.getItem('anhtu-theme');
    const savedFontSize = localStorage.getItem('anhtu-font-size');
    const savedLineHeight = localStorage.getItem('anhtu-line-height');
    const savedShowLineNumbers = localStorage.getItem('anhtu-show-line-numbers');
    const savedAutoSave = localStorage.getItem('anhtu-auto-save');
    
    if (savedTheme) setCurrentTheme(parseInt(savedTheme));
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedLineHeight) setLineHeight(parseFloat(savedLineHeight));
    if (savedShowLineNumbers) setShowLineNumbers(savedShowLineNumbers === 'true');
    if (savedAutoSave !== null) setAutoSaveEnabled(savedAutoSave === 'true');
    
    if (savedPassword) {
      setHasPassword(true);
      setIsLocked(true);
    }
    
    if (savedNote && !savedPassword) {
      try {
        const note = JSON.parse(savedNote);
        setContent(note.content || '');
        setLastSaved(new Date(note.updatedAt));
      } catch (e) {
        console.error('Error loading note:', e);
      }
    }

    // Keyboard shortcuts
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 's':
            e.preventDefault();
            handleManualSave();
            break;
          case 'f':
            e.preventDefault();
            setShowSearch(true);
            break;
          case 'k':
            e.preventDefault();
            setShowSettings(true);
            break;
          case 'm':
            e.preventDefault();
            toggleMusic();
            break;
          case 'b':
            e.preventDefault();
            setShowStats(!showStats);
            break;
        }
      }
      if (e.key === 'Escape') {
        setIsFocusMode(false);
        setShowSearch(false);
      }
    };

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyboard);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.removeEventListener('keydown', handleKeyboard);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Update audio when track changes
  useEffect(() => {
    if (audioRef.current) {
      const wasPlaying = isMusicPlaying;
      audioRef.current.pause();
      audioRef.current.src = musicTracks[currentTrack].url;
      audioRef.current.volume = volume;
      audioRef.current.loop = true;
      
      if (wasPlaying) {
        audioRef.current.play().catch(e => console.log('Audio play error:', e));
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Auto-save
  useEffect(() => {
    if (!isLocked && !hasPassword && autoSaveEnabled) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        const note = {
          content,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('anhtu-note-encrypted', JSON.stringify(note));
        setLastSaved(new Date());
        setIsSaving(false);
      }, 1000);
    }
  }, [content, isLocked, hasPassword, autoSaveEnabled]);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('anhtu-theme', currentTheme.toString());
    localStorage.setItem('anhtu-font-size', fontSize.toString());
    localStorage.setItem('anhtu-line-height', lineHeight.toString());
    localStorage.setItem('anhtu-show-line-numbers', showLineNumbers.toString());
    localStorage.setItem('anhtu-auto-save', autoSaveEnabled.toString());
  }, [currentTheme, fontSize, lineHeight, showLineNumbers, autoSaveEnabled]);

  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 20;
    if (/\d/.test(pwd)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 15;
    return Math.min(strength, 100);
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        audioRef.current.play().catch(e => {
          console.log('Audio play error:', e);
          toast.error('Không thể phát nhạc. Vui lòng thử lại!');
        });
        setIsMusicPlaying(true);
      }
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.log('Fullscreen error:', e);
      toast.error('Không thể chuyển chế độ toàn màn hình!');
    }
  };

  const handleManualSave = () => {
    if (isLocked) {
      toast.error('Vui lòng mở khóa trước!');
      return;
    }
    const note = {
      content,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('anhtu-note-encrypted', JSON.stringify(note));
    setLastSaved(new Date());
    toast.success('💾 Đã lưu thành công!');
  };

  const handleExport = () => {
    if (isLocked) {
      toast.error('Vui lòng mở khóa trước!');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anhtu-note-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Đã xuất file thành công!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
        toast.success('📤 Đã nhập file thành công!');
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('📋 Đã sao chép toàn bộ!');
    } catch (e) {
      toast.error('Không thể sao chép!');
    }
  };

  const handleClear = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ nội dung?')) {
      setContent('');
      toast.success('🗑️ Đã xóa nội dung!');
    }
  };

  const handleSetPassword = () => {
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    const encrypted = CryptoJS.AES.encrypt(content, password).toString();
    const passwordHash = CryptoJS.SHA256(password).toString();
    
    localStorage.setItem('anhtu-note-encrypted', encrypted);
    localStorage.setItem('anhtu-note-password', passwordHash);
    
    setHasPassword(true);
    setIsLocked(false);
    setShowPasswordDialog(false);
    setPassword('');
    setConfirmPassword('');
    
    toast.success('🔒 Đã bảo vệ ghi chú bằng mật khẩu!', {
      description: 'Ghi chú của bạn đã được mã hóa AES-256'
    });
  };

  const handleUnlock = () => {
    const savedPasswordHash = localStorage.getItem('anhtu-note-password');
    const enteredHash = CryptoJS.SHA256(unlockPassword).toString();
    
    if (savedPasswordHash === enteredHash) {
      const encrypted = localStorage.getItem('anhtu-note-encrypted');
      if (encrypted) {
        try {
          const decrypted = CryptoJS.AES.decrypt(encrypted, unlockPassword).toString(CryptoJS.enc.Utf8);
          setContent(decrypted);
          setIsLocked(false);
          setUnlockPassword('');
          toast.success('🔓 Đã mở khóa thành công!');
        } catch (e) {
          toast.error('Lỗi giải mã! Vui lòng thử lại.');
        }
      }
    } else {
      toast.error('❌ Mật khẩu không đúng!');
    }
  };

  const handleRemovePassword = () => {
    if (confirm('Bạn có chắc muốn gỡ bỏ mật khẩu?')) {
      localStorage.removeItem('anhtu-note-password');
      setHasPassword(false);
      setIsLocked(false);
      const note = {
        content,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('anhtu-note-encrypted', JSON.stringify(note));
      setShowPasswordDialog(false);
      toast.success('🔓 Đã gỡ bỏ mật khẩu!');
    }
  };

  const handleRawView = () => {
    if (isLocked) {
      toast.error('Vui lòng mở khóa trước!');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Yếu';
    if (passwordStrength < 70) return 'Trung bình';
    return 'Mạnh';
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Chưa lưu';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 10) return 'Vừa xong';
    if (seconds < 60) return `${seconds}s trước`;
    if (minutes < 60) return `${minutes}m trước`;
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const theme = themes[currentTheme];
  const bgColor = isDarkMode ? theme.bg : 'bg-white';
  const textColor = isDarkMode ? theme.text : 'text-gray-900';
  const borderColor = isDarkMode ? theme.border : 'border-gray-200';
  const secondaryBg = isDarkMode ? theme.secondary : 'bg-gray-50';
  const hoverBg = isDarkMode ? 'hover:bg-[#2a2d2e]' : 'hover:bg-gray-100';

  if (isLocked) {
    return (
      <div className={`size-full flex items-center justify-center ${bgColor} relative overflow-hidden`}>
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full bg-gradient-to-r ${theme.gradient} blur-2xl`}
              style={{
                width: Math.random() * 200 + 100,
                height: Math.random() * 200 + 100,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, Math.random() * 200 - 100],
                x: [0, Math.random() * 200 - 100],
                scale: [1, Math.random() + 0.5, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 20 + 15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`max-w-md w-full mx-4 p-8 rounded-2xl ${secondaryBg} border ${borderColor} shadow-2xl backdrop-blur-xl relative z-10`}
        >
          <div className="text-center mb-6">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className={`inline-block p-4 bg-gradient-to-br ${theme.accent} rounded-full mb-4 shadow-lg`}
            >
              <Shield className="size-12 text-white" />
            </motion.div>
            <h1 className={`text-3xl font-bold mb-2 bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>
              anhtu 🌈💕
            </h1>
            <p className="text-gray-500 mb-4">Ghi chú được bảo vệ</p>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-400 flex items-center justify-center gap-2">
                <Shield className="size-3" />
                AES-256 Military Grade Encryption
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu..."
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                className={`w-full pl-10 pr-12 py-3 rounded-lg border ${borderColor} ${bgColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                autoFocus
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUnlock}
              className={`w-full py-3 bg-gradient-to-r ${theme.accent} text-white rounded-lg hover:shadow-lg transition-all font-semibold`}
            >
              🔓 Mở khóa
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <Tooltip.Provider>
      <div className={`size-full flex flex-col ${bgColor} ${textColor} relative overflow-hidden`}>
        {/* Animated background particles */}
        {!isFocusMode && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-full bg-gradient-to-r ${theme.gradient} blur-2xl`}
                style={{
                  width: Math.random() * 300 + 150,
                  height: Math.random() * 300 + 150,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, Math.random() * 150 - 75],
                  x: [0, Math.random() * 150 - 75],
                  scale: [1, Math.random() * 0.5 + 1, 1],
                  opacity: [0.03, 0.1, 0.03],
                }}
                transition={{
                  duration: Math.random() * 25 + 20,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}

        {/* Header */}
        <AnimatePresence>
          {!isFocusMode && (
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`flex items-center justify-between px-4 py-3 border-b ${borderColor} backdrop-blur-md bg-opacity-80 relative z-10 ${secondaryBg}`}
            >
              <div className="flex items-center gap-3">
                <motion.h1
                  className={`text-xl font-bold bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}
                  whileHover={{ scale: 1.05 }}
                >
                  anhtu 🌈💕
                </motion.h1>
                
                <div className="flex items-center gap-2 text-xs">
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="text-blue-400 flex items-center gap-1"
                    >
                      <RefreshCw className="size-3" />
                      <span className="hidden sm:inline">Đang lưu...</span>
                    </motion.div>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-1">
                      <Check className="size-3 text-green-400" />
                      <span className="hidden sm:inline">{formatTime(lastSaved)}</span>
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSearch(!showSearch)}
                      className={`p-2 rounded-lg ${hoverBg} transition-colors ${showSearch ? `bg-gradient-to-r ${theme.accent} text-white` : ''}`}
                    >
                      <Search className="size-4" />
                    </motion.button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                    Tìm kiếm (Ctrl+F)
                  </Tooltip.Content>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowStats(!showStats)}
                      className={`p-2 rounded-lg ${hoverBg} transition-colors ${showStats ? `bg-gradient-to-r ${theme.accent} text-white` : ''}`}
                    >
                      <BarChart3 className="size-4" />
                    </motion.button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                    Thống kê (Ctrl+B)
                  </Tooltip.Content>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopyAll}
                      className={`p-2 rounded-lg ${hoverBg} transition-colors`}
                    >
                      {copied ? <Check className="size-4 text-green-400" /> : <Copy className="size-4" />}
                    </motion.button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                    Sao chép tất cả
                  </Tooltip.Content>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleManualSave}
                      className={`p-2 rounded-lg ${hoverBg} transition-colors`}
                    >
                      <Save className="size-4" />
                    </motion.button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                    Lưu (Ctrl+S)
                  </Tooltip.Content>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleExport}
                      className={`p-2 rounded-lg ${hoverBg} transition-colors`}
                    >
                      <Download className="size-4" />
                    </motion.button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                    Xuất file
                  </Tooltip.Content>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <label className={`p-2 rounded-lg ${hoverBg} transition-colors cursor-pointer`}>
                      <Upload className="size-4" />
                      <input type="file" accept=".txt,.md" onChange={handleImport} className="hidden" />
                    </label>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                    Nhập file
                  </Tooltip.Content>
                </Tooltip.Root>
                
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRawView}
                      className={`p-2 rounded-lg ${hoverBg} transition-colors`}
                    >
                      <FileText className="size-4" />
                    </motion.button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                    Xem Raw
                  </Tooltip.Content>
                </Tooltip.Root>
                
                <Dialog.Root open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Dialog.Trigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-2 rounded-lg ${hoverBg} transition-colors ${
                            hasPassword ? 'text-green-400' : ''
                          }`}
                        >
                          <Lock className="size-4" />
                        </motion.button>
                      </Dialog.Trigger>
                    </Tooltip.Trigger>
                    <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                      Mật khẩu {hasPassword ? '(Đã bật)' : ''}
                    </Tooltip.Content>
                  </Tooltip.Root>
                  
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                    <Dialog.Content className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full mx-4 p-6 rounded-2xl ${secondaryBg} border ${borderColor} shadow-2xl z-50`}>
                      <Dialog.Title className={`text-xl mb-2 ${textColor} flex items-center gap-2 font-bold`}>
                        <Shield className="size-5" />
                        {hasPassword ? 'Quản lý mật khẩu' : 'Đặt mật khẩu bảo vệ'}
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-gray-500 mb-4">
                        {hasPassword ? 'Quản lý bảo mật cho ghi chú của bạn' : 'Bảo vệ ghi chú của bạn bằng mã hóa AES-256'}
                      </Dialog.Description>
                      
                      {!hasPassword ? (
                        <div className="space-y-4">
                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-xs text-blue-400 flex items-center justify-center gap-2">
                              <Shield className="size-3" />
                              Sử dụng mã hóa AES-256 chuẩn quân sự
                            </p>
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block font-medium">Mật khẩu</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border ${borderColor} ${bgColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                placeholder="Nhập mật khẩu..."
                              />
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </button>
                            </div>
                            {password && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-500">Độ mạnh: {getPasswordStrengthText()}</span>
                                  <span className="text-gray-500">{passwordStrength}%</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${passwordStrength}%` }}
                                    className={`h-full transition-all ${getPasswordStrengthColor()}`}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block font-medium">Xác nhận mật khẩu</label>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className={`w-full px-4 py-2 rounded-lg border ${borderColor} ${bgColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                              placeholder="Nhập lại mật khẩu..."
                            />
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSetPassword}
                            className={`w-full py-3 bg-gradient-to-r ${theme.accent} text-white rounded-lg transition-all font-semibold shadow-lg`}
                          >
                            🔒 Đặt mật khẩu
                          </motion.button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-sm text-green-400 flex items-center gap-2 font-medium">
                              <Check className="size-4" />
                              Ghi chú đã được bảo vệ bằng mật khẩu
                            </p>
                            <p className="text-xs text-gray-500 mt-1">🔐 AES-256 Encryption Active</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRemovePassword}
                            className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold shadow-lg"
                          >
                            🔓 Gỡ bỏ mật khẩu
                          </motion.button>
                        </div>
                      )}
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
                
                <div className="h-6 w-px bg-gray-700 mx-1"></div>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleMusic}
                      className={`p-2 rounded-lg ${hoverBg} transition-colors ${
                        isMusicPlaying ? 'text-purple-400' : ''
                      }`}
                    >
                      <Music className="size-4" />
                    </motion.button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                    Nhạc nền (Ctrl+M)
                  </Tooltip.Content>
                </Tooltip.Root>
                
                {isMusicPlaying && (
                  <>
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <VolumeX className="size-3 text-gray-500" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-16 h-1 accent-purple-500"
                      />
                      <Volume2 className="size-3 text-gray-500" />
                    </motion.div>
                    
                    <select
                      value={currentTrack}
                      onChange={(e) => setCurrentTrack(parseInt(e.target.value))}
                      className={`text-xs px-2 py-1 rounded ${secondaryBg} border ${borderColor} ${textColor} focus:outline-none`}
                    >
                      {musicTracks.map((track, i) => (
                        <option key={i} value={i}>{track.name}</option>
                      ))}
                    </select>
                  </>
                )}

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsFocusMode(!isFocusMode)}
                      className={`p-2 rounded-lg ${hoverBg} transition-colors ${isFocusMode ? 'text-yellow-400' : ''}`}
                    >
                      <Target className="size-4" />
                    </motion.button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                    Chế độ tập trung (Esc)
                  </Tooltip.Content>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleFullscreen}
                      className={`p-2 rounded-lg ${hoverBg} transition-colors ${isFullscreen ? 'text-blue-400' : ''}`}
                    >
                      {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                    </motion.button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                    Toàn màn hình (F11)
                  </Tooltip.Content>
                </Tooltip.Root>

                <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Dialog.Trigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-2 rounded-lg ${hoverBg} transition-all`}
                        >
                          <Settings className="size-4" />
                        </motion.button>
                      </Dialog.Trigger>
                    </Tooltip.Trigger>
                    <Tooltip.Content className="bg-black text-white px-2 py-1 rounded text-xs">
                      Cài đặt (Ctrl+K)
                    </Tooltip.Content>
                  </Tooltip.Root>
                  
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                    <Dialog.Content className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl w-full mx-4 p-6 rounded-2xl ${secondaryBg} border ${borderColor} shadow-2xl z-50 max-h-[85vh] overflow-auto`}>
                      <Dialog.Title className={`text-2xl mb-2 ${textColor} flex items-center gap-2 font-bold`}>
                        <Sparkles className="size-6" />
                        Cài đặt nâng cao
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-gray-500 mb-4">
                        Tùy chỉnh trải nghiệm ghi chú của bạn
                      </Dialog.Description>

                      <Tabs.Root defaultValue="general" className="w-full">
                        <Tabs.List className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
                          <Tabs.Trigger 
                            value="general" 
                            className={`px-4 py-2 rounded-lg transition-all font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:${theme.accent} data-[state=active]:text-white`}
                          >
                            ⚙️ Chung
                          </Tabs.Trigger>
                          <Tabs.Trigger 
                            value="editor"
                            className={`px-4 py-2 rounded-lg transition-all font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:${theme.accent} data-[state=active]:text-white`}
                          >
                            📝 Editor
                          </Tabs.Trigger>
                          <Tabs.Trigger 
                            value="themes" 
                            className={`px-4 py-2 rounded-lg transition-all font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:${theme.accent} data-[state=active]:text-white`}
                          >
                            🎨 Giao diện
                          </Tabs.Trigger>
                          <Tabs.Trigger 
                            value="shortcuts" 
                            className={`px-4 py-2 rounded-lg transition-all font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:${theme.accent} data-[state=active]:text-white`}
                          >
                            ⌨️ Phím tắt
                          </Tabs.Trigger>
                        </Tabs.List>

                        <Tabs.Content value="general" className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                            <div>
                              <p className={`${textColor} font-medium`}>Tự động lưu</p>
                              <p className="text-xs text-gray-500">Lưu tự động sau mỗi thay đổi (1s delay)</p>
                            </div>
                            <label className="relative inline-block w-12 h-6">
                              <input
                                type="checkbox"
                                checked={autoSaveEnabled}
                                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-full h-full bg-gray-700 peer-checked:bg-purple-500 rounded-full transition-all shadow-inner"></div>
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-md"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                            <div>
                              <p className={`${textColor} font-medium`}>Dark Mode</p>
                              <p className="text-xs text-gray-500">Chế độ tối bảo vệ đôi mắt</p>
                            </div>
                            <label className="relative inline-block w-12 h-6">
                              <input
                                type="checkbox"
                                checked={isDarkMode}
                                onChange={(e) => setIsDarkMode(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-full h-full bg-gray-700 peer-checked:bg-purple-500 rounded-full transition-all shadow-inner"></div>
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-md"></div>
                            </label>
                          </div>

                          <div className="p-4 rounded-lg border border-gray-700">
                            <p className={`${textColor} font-medium mb-2`}>Thông tin lưu trữ</p>
                            <div className="space-y-1 text-sm text-gray-500">
                              <p>💾 Dữ liệu được lưu trong LocalStorage</p>
                              <p>🔐 Mã hóa AES-256 khi có mật khẩu</p>
                              <p>⚡ Tự động đồng bộ realtime</p>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleClear}
                            className="w-full py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 font-semibold"
                          >
                            🗑️ Xóa toàn bộ nội dung
                          </motion.button>
                        </Tabs.Content>

                        <Tabs.Content value="editor" className="space-y-4">
                          <div className="p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                              <p className={`${textColor} font-medium`}>Cỡ chữ</p>
                              <span className="text-sm text-gray-500">{fontSize}px</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="24"
                              value={fontSize}
                              onChange={(e) => setFontSize(parseInt(e.target.value))}
                              className="w-full accent-purple-500"
                            />
                          </div>

                          <div className="p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                              <p className={`${textColor} font-medium`}>Khoảng cách dòng</p>
                              <span className="text-sm text-gray-500">{lineHeight}</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="2.5"
                              step="0.1"
                              value={lineHeight}
                              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                              className="w-full accent-purple-500"
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                            <div>
                              <p className={`${textColor} font-medium`}>Hiển thị số dòng</p>
                              <p className="text-xs text-gray-500">Bật/tắt line numbers bên trái</p>
                            </div>
                            <label className="relative inline-block w-12 h-6">
                              <input
                                type="checkbox"
                                checked={showLineNumbers}
                                onChange={(e) => setShowLineNumbers(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-full h-full bg-gray-700 peer-checked:bg-purple-500 rounded-full transition-all shadow-inner"></div>
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-md"></div>
                            </label>
                          </div>
                        </Tabs.Content>

                        <Tabs.Content value="themes" className="space-y-4">
                          <p className="text-sm text-gray-500 mb-4">Chọn theme yêu thích của bạn</p>
                          <div className="grid grid-cols-2 gap-4">
                            {themes.map((t, index) => (
                              <motion.button
                                key={t.name}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCurrentTheme(index)}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                  currentTheme === index 
                                    ? `border-purple-500 ${t.secondary} shadow-lg` 
                                    : `border-gray-700 ${t.secondary} opacity-60 hover:opacity-80`
                                }`}
                              >
                                <div className={`h-12 rounded-lg bg-gradient-to-r ${t.accent} mb-3 shadow-md`}></div>
                                <p className={`text-sm font-semibold ${t.text}`}>{t.name}</p>
                                {currentTheme === index && (
                                  <Check className="size-5 text-purple-500 mx-auto mt-2" />
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </Tabs.Content>

                        <Tabs.Content value="shortcuts" className="space-y-3">
                          <p className="text-sm text-gray-500 mb-4">Phím tắt hữu ích để tăng năng suất</p>
                          {[
                            { key: 'Ctrl + S', desc: 'Lưu thủ công', icon: '💾' },
                            { key: 'Ctrl + F', desc: 'Tìm kiếm', icon: '🔍' },
                            { key: 'Ctrl + K', desc: 'Cài đặt', icon: '⚙️' },
                            { key: 'Ctrl + M', desc: 'Bật/tắt nhạc', icon: '🎵' },
                            { key: 'Ctrl + B', desc: 'Thống kê', icon: '📊' },
                            { key: 'F11', desc: 'Toàn màn hình', icon: '🖥️' },
                            { key: 'Esc', desc: 'Thoát focus mode', icon: '🎯' },
                          ].map(({ key, desc, icon }) => (
                            <div key={key} className="flex justify-between items-center p-3 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                              <span className="text-sm text-gray-400 flex items-center gap-2">
                                <span>{icon}</span>
                                {desc}
                              </span>
                              <kbd className={`px-3 py-1 text-xs rounded ${secondaryBg} border ${borderColor} font-mono font-semibold`}>
                                {key}
                              </kbd>
                            </div>
                          ))}
                        </Tabs.Content>
                      </Tabs.Root>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && !isFocusMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-4 py-3 border-b ${borderColor} ${secondaryBg} relative z-10`}
            >
              <div className="relative max-w-lg mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-purple-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm trong ghi chú..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${borderColor} ${secondaryBg} ${textColor} focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner`}
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Panel */}
        <AnimatePresence>
          {showStats && !isFocusMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-4 py-4 border-b ${borderColor} ${secondaryBg} relative z-10`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {stats.words}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Từ</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {stats.characters}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Ký tự</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {stats.lines}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Dòng</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    {stats.paragraphs}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Đoạn</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                    {stats.sentences}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Câu</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                  <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                    {stats.readingTime}m
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Đọc</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          {/* Line numbers */}
          {showLineNumbers && !isFocusMode && (
            <div className={`${secondaryBg} ${textColor} opacity-50 px-4 py-4 select-none overflow-hidden border-r ${borderColor}`}>
              <div className="font-mono text-right" style={{ fontSize: `${fontSize}px`, lineHeight }}>
                {lineNumbers.map((num) => (
                  <div key={num}>{num}</div>
                ))}
              </div>
            </div>
          )}

          {/* Editor area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="✨ Bắt đầu viết gì đó tuyệt vời..."
              style={{ 
                fontSize: `${fontSize}px`, 
                lineHeight 
              }}
              className={`w-full h-full ${isFocusMode ? 'px-8 md:px-32 lg:px-48' : 'px-6'} py-6 ${bgColor} ${textColor} font-mono resize-none focus:outline-none placeholder:opacity-30 placeholder:italic bg-transparent transition-all`}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Footer */}
        <AnimatePresence>
          {!isFocusMode && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={`px-4 py-2 border-t ${borderColor} ${secondaryBg} text-xs flex items-center justify-between relative z-10`}
            >
              <div className="flex items-center gap-4">
                <span className="text-gray-500">📍 Dòng {stats.lines} · Cột {content.length}</span>
                {hasPassword && (
                  <span className="text-green-400 flex items-center gap-1 font-medium">
                    <Lock className="size-3" /> Đã mã hóa
                  </span>
                )}
                <span className={`flex items-center gap-1 bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent font-medium`}>
                  <Zap className="size-3" /> {theme.name}
                </span>
              </div>
              <div className="flex items-center gap-4 text-gray-500">
                <span>📝 {stats.words} từ · {stats.characters} ký tự</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> {stats.readingTime} phút đọc
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Tooltip.Provider>
  );
}
