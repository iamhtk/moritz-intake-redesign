/**
 * Shared helpers for turning browser File objects into the intake's lightweight
 * `IntakeFile` records. Used by both the inline documents dropzone and the
 * attachments dialog so files are added identically wherever they come from.
 */

import { type IconType } from 'react-icons';
import {
  FaFile,
  FaFileAlt,
  FaFileArchive,
  FaFileCode,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
} from 'react-icons/fa';
import { type IntakeFile } from './intake-types';

export const newId = (): string =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export function toIntakeFiles(list: FileList | File[]): IntakeFile[] {
  return Array.from(list).map((f) => ({
    id: newId(),
    name: f.name,
    size: f.size,
  }));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FileTypeIcon = { Icon: IconType; colorClass: string };

const IMAGE: FileTypeIcon = { Icon: FaFileImage, colorClass: 'text-amber-500' };
const NEUTRAL: FileTypeIcon = {
  Icon: FaFileAlt,
  colorClass: 'text-muted-foreground',
};
const ARCHIVE: FileTypeIcon = {
  Icon: FaFileArchive,
  colorClass: 'text-muted-foreground',
};
const CODE: FileTypeIcon = {
  Icon: FaFileCode,
  colorClass: 'text-muted-foreground',
};

// Recognizable file-type glyphs with the standard per-type colors.
const EXTENSION_ICONS: Record<string, FileTypeIcon> = {
  png: IMAGE,
  jpg: IMAGE,
  jpeg: IMAGE,
  gif: IMAGE,
  webp: IMAGE,
  svg: IMAGE,
  heic: IMAGE,
  pdf: { Icon: FaFilePdf, colorClass: 'text-red-600' },
  doc: { Icon: FaFileWord, colorClass: 'text-blue-600' },
  docx: { Icon: FaFileWord, colorClass: 'text-blue-600' },
  rtf: { Icon: FaFileWord, colorClass: 'text-blue-600' },
  txt: NEUTRAL,
  md: NEUTRAL,
  xls: { Icon: FaFileExcel, colorClass: 'text-green-600' },
  xlsx: { Icon: FaFileExcel, colorClass: 'text-green-600' },
  csv: { Icon: FaFileExcel, colorClass: 'text-green-600' },
  ppt: { Icon: FaFilePowerpoint, colorClass: 'text-orange-500' },
  pptx: { Icon: FaFilePowerpoint, colorClass: 'text-orange-500' },
  key: { Icon: FaFilePowerpoint, colorClass: 'text-orange-500' },
  zip: ARCHIVE,
  rar: ARCHIVE,
  '7z': ARCHIVE,
  tar: ARCHIVE,
  gz: ARCHIVE,
  ts: CODE,
  tsx: CODE,
  js: CODE,
  jsx: CODE,
  json: CODE,
  html: CODE,
  css: CODE,
};

/** Pick a colored file-type icon for a file from its name's extension. */
export function describeFile(name: string): FileTypeIcon {
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
  return (
    EXTENSION_ICONS[ext] ?? {
      Icon: FaFile,
      colorClass: 'text-muted-foreground',
    }
  );
}
