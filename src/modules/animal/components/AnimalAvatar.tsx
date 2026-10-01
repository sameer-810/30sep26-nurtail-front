import type { Species } from "../api/animalApi";
import { SPECIES_TINT } from "../constants";
import { cn } from "@/lib/utils";

/**
 * Photo, or the blueprint's initial disc in a species tint when there isn't one
 * yet. Decorative: the name always sits next to it, so alt text is empty.
 */
export function AnimalAvatar({
  name,
  species,
  photoUrl,
  size = 44,
  className,
}: {
  name: string;
  species: Species;
  photoUrl?: string;
  size?: number;
  className?: string;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-display font-semibold",
        SPECIES_TINT[species],
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
