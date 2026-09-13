/**
 * What the intake will read, how many at a time, and what it says about
 * anything else (Decision 15).
 *
 * This started as one file at a time and a list of extensions. Both were wrong.
 *
 * **One at a time was wrong** because a matter arrives as a bundle. An MSA has
 * an order form and a DPA; a renewal comes with the original executed version
 * to compare against; a dispute is a contract plus the letter about it. Asking
 * a client to hand those over one by one, and to wait for a round trip between
 * each, is asking them to do the filing.
 *
 * **The extension list was wrong** in a way that had shipped: the picker
 * offered PDF, Word and images, and every accepted file was then sent to the
 * model as `application/pdf`. A photo of a letter came back
 * `The PDF specified was not valid`, which the client read as "I could not read
 * that file". So what a file *is* is decided here too, and it is decided by
 * what the Messages API can actually read rather than by what the picker was
 * willing to show.
 */

/** Content-block kinds the extract route knows how to build. */
export type AcceptedKind = 'pdf' | 'image';

/**
 * The four image types the Messages API accepts. Not a wildcard.
 *
 * `image/*` in an `accept` attribute is a promise the API does not keep. HEIC
 * is the one that matters: it is what an iPhone produces by default, so the
 * single most likely way a client photographs a letter produces a file that
 * cannot be read. It is turned away with its own sentence rather than a generic
 * one, because "use a different format" is useless and "your phone can save as
 * JPEG" is not.
 */
const IMAGE_MEDIA_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const PDF_MEDIA_TYPE = 'application/pdf';

/**
 * For the `accept` attribute on a file input.
 *
 * Deliberately wider than what can be read. Word files and HEIC photos are
 * offered by the picker and then turned away with an explanation, because a
 * greyed-out file in a picker tells the client nothing: they do not learn that
 * a PDF export would work, and on a drag and drop the attribute does nothing
 * at all. The explanation is the product; the filter is only a convenience.
 */
export const ACCEPTED_FILES_ATTRIBUTE = '.pdf,.doc,.docx,image/*';

/**
 * 10 MB per file, checked in the browser before anything is read.
 *
 * Files are base64-encoded into a JSON body, which inflates them by about a
 * third. What this stops is a 60 MB scan being encoded in a tab that then dies,
 * which reads to the client as the intake breaking rather than as a file being
 * too big.
 */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * 15 MB across one request, and at most five files.
 *
 * The API's own request ceiling is 32 MB, and base64 puts 15 MB of documents at
 * roughly 20 MB on the wire, so this leaves room for the rest of the body. The
 * file count is the softer of the two limits and exists for the reading rather
 * than the transport: five contracts in one extraction call is already more
 * than a client can sensibly check on one screen, and the API caps total pages
 * per request as well.
 */
export const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
export const MAX_FILES = 5;

/**
 * Why a file was turned away. The copy for each lives in `intake.upload`.
 *
 * `word` and `imageFormat` are split out from `type` because both have a real
 * next step the client can take, and a rejection that names one is worth three
 * that do not.
 */
export type FileRejection =
  | 'type'
  | 'word'
  | 'imageFormat'
  | 'size'
  | 'empty'
  | 'count'
  | 'total';

export type AcceptedFile = {
  file: File;
  kind: AcceptedKind;
  /** What the content block will declare. Never guessed from the name alone. */
  mediaType: string;
};

export type RejectedFile = { name: string; reason: FileRejection };

export type FileChoice = {
  accepted: AcceptedFile[];
  rejected: RejectedFile[];
};

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

/**
 * What this file is, or why it cannot be read.
 *
 * The type is trusted over the name for images, because the phone that took the
 * photo will name the file anything at all (`IMG_0042`, sometimes nothing), and
 * the name is trusted over the type for PDFs, because browsers report an empty
 * type for a file dragged out of some archives and folders.
 */
export function classifyFile(file: File): AcceptedKind | FileRejection {
  const extension = extensionOf(file.name);

  if (file.type === PDF_MEDIA_TYPE || extension === 'pdf') return 'pdf';
  if (IMAGE_MEDIA_TYPES.includes(file.type)) return 'image';

  // Named as an image, or reported as one, but not a format that can be read.
  if (
    file.type.startsWith('image/') ||
    ['heic', 'heif', 'tif', 'tiff', 'bmp', 'avif', 'svg'].includes(extension)
  ) {
    return 'imageFormat';
  }

  if (['doc', 'docx'].includes(extension)) return 'word';

  return 'type';
}

export function mediaTypeFor(file: File, kind: AcceptedKind): string {
  return kind === 'pdf' ? PDF_MEDIA_TYPE : file.type;
}

/**
 * Sort a dropped or picked set into what will be read and what will not.
 *
 * Order matters. A file is judged on its own terms first (can it be read, is it
 * empty, is it too big), and only then against the limits that depend on what
 * else came with it. That way a client dropping one good file and one 60 MB
 * scan is told about the scan, rather than being told they hit a total size
 * limit they did not.
 *
 * @param alreadyAttached files staged from an earlier drop, which count against
 * the same limits. Without this, dropping three files twice would attach six
 * and then fail at the request.
 */
export function chooseFiles(
  files: readonly File[],
  alreadyAttached: readonly { size: number }[] = [],
): FileChoice {
  const accepted: AcceptedFile[] = [];
  const rejected: RejectedFile[] = [];

  let count = alreadyAttached.length;
  let total = alreadyAttached.reduce((sum, one) => sum + one.size, 0);

  for (const file of files) {
    const verdict = classifyFile(file);
    if (verdict !== 'pdf' && verdict !== 'image') {
      rejected.push({ name: file.name, reason: verdict });
      continue;
    }

    if (file.size === 0) {
      rejected.push({ name: file.name, reason: 'empty' });
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      rejected.push({ name: file.name, reason: 'size' });
      continue;
    }
    if (count >= MAX_FILES) {
      rejected.push({ name: file.name, reason: 'count' });
      continue;
    }
    if (total + file.size > MAX_TOTAL_BYTES) {
      rejected.push({ name: file.name, reason: 'total' });
      continue;
    }

    accepted.push({
      file,
      kind: verdict,
      mediaType: mediaTypeFor(file, verdict),
    });
    count += 1;
    total += file.size;
  }

  return { accepted, rejected };
}
