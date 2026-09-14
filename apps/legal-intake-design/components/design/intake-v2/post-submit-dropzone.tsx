'use client';

import { useTranslations } from 'next-intl';
import { describeFile } from '@/components/design/new-case/file-utils';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { ACCEPTED_FILES_ATTRIBUTE } from '@/lib/intake/accepted-files';

export type AddedDocument = { id: string; name: string };

/**
 * The channel does not close when the case is sent (Decision 24).
 *
 * Garzai's observation was that clients keep sending documents after
 * submission and never see the agent again. The case page is where that
 * conversation is supposed to continue, and building the case page is not this
 * project, but the target itself costs almost nothing: the drop handling is
 * already here, the chat strip is already live, and leaving both alive is the
 * difference between a finished form and an open channel.
 *
 * What it does *not* do is quietly re-open the brief. A sent brief is a record,
 * every value on it has been agreed, and running extraction over a late
 * document would start proposing changes to a case that is already with the
 * firm. So the file is received, said out loud in the chat, and listed here.
 * One sentence, and it is true: this is where it goes and who gets it.
 */
export function PostSubmitDropzone({
  documents,
  onAttach,
  onOpen,
  isTheOneThing = false,
}: {
  documents: readonly AddedDocument[];
  onAttach: (files: File[]) => void;
  /**
   * Whether handing over a document is the one thing that would help this case
   * most (item 7, the `document` ask).
   *
   * Changes the words rather than adding a block. "Something else to add?" is
   * the right question for a client who attached their contract and might have
   * a second file; it is the wrong question entirely for a case with no
   * document on it at all, where the answer is not "something else" but "the
   * thing". Same target, same drop handling, a heading that knows which of the
   * two situations it is in.
   *
   * The alternative was a separate "one more thing" panel above this one, and
   * it was rejected for the reason the start screen's standalone dropzone was
   * deleted: two places to hand over a file is the upload complaint.
   */
  isTheOneThing?: boolean;
  /**
   * Opens one of the documents listed here.
   *
   * The list used to be a receipt and nothing else, which is thin in the one
   * place it matters most: this is the last screen of the intake, the client
   * has just handed over a document to a case they can no longer edit, and
   * "did the right file go" is the only question they can still usefully ask.
   * Optional, because the list is also worth showing where there is no viewer
   * to open it in.
   */
  onOpen?: (name: string) => void;
}) {
  const t = useTranslations('intake.sent');

  return (
    <div className="flex flex-col gap-3">
      <p className="text-foreground text-sm font-medium">
        {isTheOneThing ? t('oneMore.document.title') : t('addMoreTitle')}
      </p>

      {/*
       * The reason, and only when there is one. A client who already sent the
       * contract does not need to be told what a contract is for.
       */}
      {isTheOneThing ? (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t('oneMore.document.hint')}
        </p>
      ) : null}

      {documents.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {documents.map((added) => (
            <li key={added.id}>
              {onOpen ? (
                /*
                 * The name is underlined at rest rather than on hover. A file
                 * name in a list of files handed over reads as a label, and a
                 * client who has finished an intake is not going to hover over
                 * the record to find out which parts of it are controls — the
                 * same reason the resize grip is drawn before it is touched.
                 */
                <button
                  type="button"
                  onClick={() => onOpen(added.name)}
                  title={added.name}
                  className="text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] focus-visible:outline-ring focus-visible:outline-solid mz-tap relative -mx-1.5 flex w-full cursor-pointer items-center gap-2 rounded-[0.5rem] px-1.5 py-1 text-left text-sm outline-none transition-colors focus-visible:outline-2"
                >
                  <FileGlyph name={added.name} />
                  <span className="decoration-border truncate underline underline-offset-2">
                    {added.name}
                  </span>
                </button>
              ) : (
                <span className="text-muted-foreground flex items-center gap-2 py-1 text-sm">
                  <FileGlyph name={added.name} />
                  <span className="truncate">{added.name}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {/*
       * The repo's own dropzone, at the smaller end of its size range. It is
       * not the opening screen's headline affordance any more, it is a thing
       * kept available, and it should read that way next to a confirmation.
       */}
      <FileDropzone
        id="intake-post-submit-document"
        accept={ACCEPTED_FILES_ATTRIBUTE}
        multiple
        onFilesSelected={onAttach}
        label={t('addMoreLabel')}
        hint={t('addMoreHint')}
        buttonLabel={t('addMoreButton')}
        className="gap-2.5 rounded-2xl px-4 py-5"
      />
    </div>
  );
}

/**
 * The file's own glyph and colour (§1 #8).
 *
 * Both rows here — the one that opens the document and the one that cannot —
 * drew the same slate page icon for every file. `describeFile` is the map the
 * case pages and the document viewer already use, so a PDF handed over after
 * submission now looks like the PDF it will look like on the case page.
 *
 * A local component rather than two copies of three lines, because the two
 * rows differ only in whether the name is a button and the glyph is the one
 * thing that must not drift between them.
 */
function FileGlyph({ name }: { name: string }) {
  const { Icon, colorClass } = describeFile(name);
  return (
    <Icon aria-hidden="true" className={`size-3.5 shrink-0 ${colorClass}`} />
  );
}
