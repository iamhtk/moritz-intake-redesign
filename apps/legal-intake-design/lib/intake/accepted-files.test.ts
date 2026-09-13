import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_FILES_ATTRIBUTE,
  chooseFiles,
  classifyFile,
  extensionOf,
  MAX_FILE_BYTES,
  MAX_FILES,
  MAX_TOTAL_BYTES,
} from './accepted-files';

/** A file of a given size without allocating that many bytes. */
function fakeFile(name: string, type: string, size = 1024): File {
  const file = new File([], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

const pdf = (name = 'msa.pdf', size = 1024) =>
  fakeFile(name, 'application/pdf', size);

describe('extensionOf', () => {
  it('reads the last extension, case insensitively', () => {
    expect(extensionOf('contract.final.PDF')).toBe('pdf');
  });

  it('has no extension for a bare name, a dotfile or a trailing dot', () => {
    expect(extensionOf('contract')).toBe('');
    expect(extensionOf('.gitignore')).toBe('');
    expect(extensionOf('contract.')).toBe('');
  });
});

describe('classifyFile', () => {
  it('takes a PDF by type or by name', () => {
    expect(classifyFile(pdf())).toBe('pdf');
    // Browsers report an empty type for files dragged out of some folders.
    expect(classifyFile(fakeFile('msa.pdf', ''))).toBe('pdf');
  });

  it('takes the four image formats the API can read', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) {
      expect(classifyFile(fakeFile('letter', type))).toBe('image');
    }
  });

  /*
   * The bug this classification exists for. Every accepted file used to be sent
   * as `application/pdf`, so a photo came back "The PDF specified was not
   * valid" and the client was told the file could not be read.
   */
  it('tells a photo apart from a document rather than assuming PDF', () => {
    expect(classifyFile(fakeFile('IMG_0042', 'image/jpeg'))).toBe('image');
    expect(classifyFile(pdf())).toBe('pdf');
  });

  // What an iPhone produces by default, so it needs its own sentence.
  it('turns away a HEIC photo as a format problem, not a type problem', () => {
    expect(classifyFile(fakeFile('IMG_0042.HEIC', 'image/heic'))).toBe(
      'imageFormat',
    );
    expect(classifyFile(fakeFile('scan.tiff', ''))).toBe('imageFormat');
  });

  // The API cannot read Word at all, and "export a PDF" is a real next step.
  it('turns away Word files as their own case', () => {
    expect(classifyFile(fakeFile('contract.docx', ''))).toBe('word');
    expect(classifyFile(fakeFile('contract.doc', 'application/msword'))).toBe(
      'word',
    );
  });

  it('turns away everything else', () => {
    expect(classifyFile(fakeFile('notes.txt', 'text/plain'))).toBe('type');
    expect(classifyFile(fakeFile('archive.zip', 'application/zip'))).toBe(
      'type',
    );
    expect(classifyFile(fakeFile('sheet.xlsx', ''))).toBe('type');
  });
});

describe('chooseFiles', () => {
  it('says nothing about an empty drop', () => {
    expect(chooseFiles([])).toEqual({ accepted: [], rejected: [] });
  });

  it('takes several documents at once, in order', () => {
    const files = [pdf('msa.pdf'), pdf('dpa.pdf'), pdf('order-form.pdf')];
    const { accepted, rejected } = chooseFiles(files);
    expect(accepted.map((one) => one.file.name)).toEqual([
      'msa.pdf',
      'dpa.pdf',
      'order-form.pdf',
    ]);
    expect(rejected).toEqual([]);
  });

  it('tags each accepted file with the media type its block will declare', () => {
    const { accepted } = chooseFiles([
      pdf('msa.pdf'),
      fakeFile('letter.png', 'image/png'),
    ]);
    expect(accepted[0]).toMatchObject({
      kind: 'pdf',
      mediaType: 'application/pdf',
    });
    expect(accepted[1]).toMatchObject({
      kind: 'image',
      mediaType: 'image/png',
    });
  });

  /*
   * A good file and a bad one in the same drop is the normal case, not an edge
   * case: dragging a folder brings `.DS_Store` with it. Rejecting the whole
   * drop over one file would be indefensible.
   */
  it('takes the readable files and reports only the rest', () => {
    const { accepted, rejected } = chooseFiles([
      fakeFile('.DS_Store', ''),
      pdf('msa.pdf'),
      fakeFile('notes.txt', 'text/plain'),
    ]);
    expect(accepted.map((one) => one.file.name)).toEqual(['msa.pdf']);
    expect(rejected).toEqual([
      { name: '.DS_Store', reason: 'type' },
      { name: 'notes.txt', reason: 'type' },
    ]);
  });

  it('reports an oversized file by name and keeps the others', () => {
    const huge = pdf('scan.pdf', MAX_FILE_BYTES + 1);
    const { accepted, rejected } = chooseFiles([huge, pdf('msa.pdf')]);
    expect(accepted).toHaveLength(1);
    expect(rejected).toEqual([{ name: 'scan.pdf', reason: 'size' }]);
  });

  it('takes a file exactly at the per-file limit', () => {
    expect(
      chooseFiles([pdf('scan.pdf', MAX_FILE_BYTES)]).accepted,
    ).toHaveLength(1);
  });

  it('reports an empty file rather than reading nothing', () => {
    expect(chooseFiles([pdf('msa.pdf', 0)]).rejected).toEqual([
      { name: 'msa.pdf', reason: 'empty' },
    ]);
  });

  it('stops at the file count limit and names what it left', () => {
    const files = Array.from({ length: MAX_FILES + 2 }, (_, i) =>
      pdf(`doc-${i}.pdf`),
    );
    const { accepted, rejected } = chooseFiles(files);
    expect(accepted).toHaveLength(MAX_FILES);
    expect(rejected).toEqual([
      { name: `doc-${MAX_FILES}.pdf`, reason: 'count' },
      { name: `doc-${MAX_FILES + 1}.pdf`, reason: 'count' },
    ]);
  });

  it('stops at the total size limit', () => {
    const eight = 8 * 1024 * 1024;
    const { accepted, rejected } = chooseFiles([
      pdf('a.pdf', eight),
      pdf('b.pdf', eight),
    ]);
    expect(accepted.map((one) => one.file.name)).toEqual(['a.pdf']);
    expect(rejected).toEqual([{ name: 'b.pdf', reason: 'total' }]);
    expect(eight * 2).toBeGreaterThan(MAX_TOTAL_BYTES);
  });

  /*
   * Two drops in a row have to share one budget. Without this, dropping three
   * files twice attaches six and the request fails at the API instead of at the
   * gate, which is the one place that can explain it.
   */
  it('counts what is already staged against both limits', () => {
    const staged = Array.from({ length: MAX_FILES }, () => ({ size: 1024 }));
    expect(chooseFiles([pdf()], staged).rejected).toEqual([
      { name: 'msa.pdf', reason: 'count' },
    ]);

    const nearlyFull = [{ size: MAX_TOTAL_BYTES - 512 }];
    expect(chooseFiles([pdf('msa.pdf', 1024)], nearlyFull).rejected).toEqual([
      { name: 'msa.pdf', reason: 'total' },
    ]);
  });

  /*
   * A file is judged on its own terms before the shared limits, so a client who
   * drops one good file and one 60 MB scan hears about the scan rather than
   * about a total they never hit.
   */
  it('blames the file, not the budget, when the file is the problem', () => {
    const { rejected } = chooseFiles([pdf('scan.pdf', MAX_FILE_BYTES + 1)]);
    expect(rejected[0]?.reason).toBe('size');
  });
});

describe('ACCEPTED_FILES_ATTRIBUTE', () => {
  /*
   * Deliberately wider than what can be read. A greyed-out file in a picker
   * teaches the client nothing, and on a drag and drop the attribute does
   * nothing at all, so Word and HEIC are offered and then explained.
   */
  it('offers the formats that get an explanation, not just the readable ones', () => {
    expect(ACCEPTED_FILES_ATTRIBUTE).toContain('.pdf');
    expect(ACCEPTED_FILES_ATTRIBUTE).toContain('.docx');
    expect(ACCEPTED_FILES_ATTRIBUTE).toContain('image/*');
  });

  it('offers nothing that falls through with no sentence to say', () => {
    for (const name of ['a.pdf', 'a.doc', 'a.docx']) {
      expect(classifyFile(fakeFile(name, ''))).not.toBe('type');
    }
  });
});
