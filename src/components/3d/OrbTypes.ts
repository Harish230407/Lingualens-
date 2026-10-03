export type OrbState =
  | 'IDLE'
  | 'HOVER'
  | 'PROCESSING'
  | 'LANGUAGE_DETECTED'
  | 'RESPONDING'
  | 'LEARNING'
  | 'SUCCESS'
  | 'ERROR';

export interface LanguageNodeConfig {
  id: string;
  name: string;
  nativeName: string;
  glyph: string;
  code: string;
  color: string; // hex string e.g. '#38bdf8'
  colorNum: number; // numeric hex e.g. 0x38bdf8
  phi: number; // spherical coordinate phi
  theta: number; // spherical coordinate theta
  radius: number;
}

export interface ActiveLanguageConnection {
  sourceLang: string;
  targetLang: string;
  progress: number;
  duration: number;
  intensity: number;
}

export interface LinguaLensOrbProps {
  state?: OrbState;
  activeLanguages?: Array<{ language: string; code?: string; confidence?: number }>;
  isCodeSwitched?: boolean;
  learningLanguage?: string;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  interactive?: boolean;
  showLanguageLabels?: boolean;
  onClick?: () => void;
  className?: string;
}
