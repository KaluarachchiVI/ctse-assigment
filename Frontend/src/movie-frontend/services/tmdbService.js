import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const tmdbApi = {
  searchMovies: async (query) => {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        language: 'en-US'
      }
    });
    return response.data.results;
  },

  getMovieDetails: async (tmdbId) => {
    const [details, credits, images] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
        params: { api_key: TMDB_API_KEY }
      }),
      axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/credits`, {
        params: { api_key: TMDB_API_KEY }
      }),
      axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/images`, {
        params: { api_key: TMDB_API_KEY }
      })
    ]);

    return {
      details: details.data,
      credits: credits.data,
      images: images.data
    };
  },

  getImageUrl: (path, size = 'original') => {
    if (!path) return null;
    return `${IMAGE_BASE_URL}/${size}${path}`;
  }
};
