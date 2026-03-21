/** Static catalogue when movie-service / gateway is unavailable */
export type StaticMovie = {
  slug: string;
  title: string;
  posterUrl: string;
};

export const NOW_SHOWING_MOVIES: StaticMovie[] = [
  {
    slug: "scope-night-run",
    title: "Night Run",
    posterUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cedd3fd?w=800&q=80",
  },
  {
    slug: "scope-midnight-arcade",
    title: "Midnight Arcade",
    posterUrl:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80",
  },
  {
    slug: "scope-coastal-lines",
    title: "Coastal Lines",
    posterUrl:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
  },
];
