// Images and icons from assets/ (made by Codex or by hand), optimized by scripts/assets.mjs.
import { icons, images, type AssetIconName, type ImageName } from "@/content/assets.generated";

type ImageProps = {
  name: ImageName;
  /** Overrides the alt text from assets/images/<name>.json. Use "" for decoration. */
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  /** How wide the image is shown, so the browser picks the right file. */
  sizes?: string;
  /** Load at once (above the fold) instead of lazily. */
  priority?: boolean;
};

export function AssetImage({ name, alt, className, style, sizes = "100vw", priority = false }: ImageProps) {
  const img = images[name];
  return (
    // display: contents lets the img itself be the layout box, so size classes work inside flex rows.
    <picture className="contents">
      {img.avif && <source type="image/avif" srcSet={img.avif} sizes={sizes} />}
      {img.webp && <source type="image/webp" srcSet={img.webp} sizes={sizes} />}
      <img
        src={img.src}
        srcSet={img.fallback}
        sizes={sizes}
        width={img.width}
        height={img.height}
        alt={alt ?? img.alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={className}
        style={style}
      />
    </picture>
  );
}

type IconProps = {
  name: AssetIconName;
  className?: string;
  /** Spoken label. Without it the icon is decorative. */
  title?: string;
};

/** Inline icon: lines take the text colour (set it with text-rose, text-ink…), the gold accent stays gold. */
export function AssetIcon({ name, className = "size-6", title }: IconProps) {
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`inline-block shrink-0 ${className}`}
      // Markup comes from assets/icons and is cleaned by scripts/assets.mjs (no scripts, styles or links).
      dangerouslySetInnerHTML={{ __html: icons[name] }}
    />
  );
}

export type Icon3DName = ImageName extends infer T ? (T extends `icon-${infer N}` ? N : never) : never;

/**
 * The glossy 3D icon set (assets/images/icon-*.png) for feature spots and headings. Decorative by default;
 * pass alt when the icon carries meaning on its own. Line icons (Icons.tsx) stay for small controls.
 */
export function Icon3D({ name, className = "size-12", alt = "", sizes = "128px" }: { name: Icon3DName; className?: string; alt?: string; sizes?: string }) {
  return <AssetImage name={`icon-${name}` as ImageName} alt={alt} sizes={sizes} className={`inline-block object-contain ${className}`} />;
}

/** True when the 3D set has this icon (for content that names icons by string). */
export const has3D = (name: string): name is Icon3DName => `icon-${name}` in images;
