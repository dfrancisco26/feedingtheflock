import { useCallback, useEffect, useRef, useState } from "react";

interface Photo {
  src: string;
  alt: string;
}

interface Props {
  photos: Photo[];
}

/**
 * Progressive-enhancement lightbox. The album grid is static HTML rendered by
 * Astro; each photo is an <a data-lightbox data-index> link to the full image.
 * This island intercepts those clicks and shows an overlay viewer. With no JS,
 * the links still open the image directly.
 */
export default function Lightbox({ photos }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () =>
      setIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length)),
    [photos.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % photos.length)),
    [photos.length],
  );

  // Open when a gallery image link is clicked.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const trigger = target?.closest<HTMLElement>("[data-lightbox]");
      if (!trigger) return;
      event.preventDefault();
      const i = Number(trigger.dataset.index);
      if (!Number.isNaN(i)) setIndex(i);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Keyboard nav + scroll lock while open.
  const isOpen = index !== null;
  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") prev();
      else if (event.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [isOpen, close, prev, next]);

  if (index === null) return null;
  const photo = photos[index];

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={close}
    >
      <button
        type="button"
        className="lightbox-close"
        aria-label="Close photo viewer"
        onClick={close}
        ref={closeButtonRef}
      >
        &times;
      </button>

      <button
        type="button"
        className="lightbox-nav lightbox-prev"
        aria-label="Previous photo"
        onClick={(event) => {
          event.stopPropagation();
          prev();
        }}
      >
        &#8249;
      </button>

      <figure className="lightbox-figure" onClick={(event) => event.stopPropagation()}>
        <img src={photo.src} alt={photo.alt} />
        <figcaption>
          <span>{photo.alt}</span>
          <span className="lightbox-count">
            {index + 1} / {photos.length}
          </span>
        </figcaption>
      </figure>

      <button
        type="button"
        className="lightbox-nav lightbox-next"
        aria-label="Next photo"
        onClick={(event) => {
          event.stopPropagation();
          next();
        }}
      >
        &#8250;
      </button>
    </div>
  );
}
