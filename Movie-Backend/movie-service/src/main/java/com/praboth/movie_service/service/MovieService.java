package com.praboth.movie_service.service;

import com.praboth.movie_service.model.Movie;
import com.praboth.movie_service.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    public Optional<Movie> getMovieById(String id) {
        return movieRepository.findById(id);
    }

    public List<Movie> getMoviesByStatus(String status) {
        return movieRepository.findByStatus(status);
    }

    public List<Movie> getMoviesByGenre(String genre) {
        return movieRepository.findByGenre(genre);
    }

    public List<Movie> searchMovies(String title) {
        return movieRepository.findByTitleContainingIgnoreCase(title);
    }

    public Movie createMovie(Movie movie) {
        return movieRepository.save(movie);
    }

    public Movie updateMovie(String id, Movie updatedMovie) {
        return movieRepository.findById(id)
                .map(existingMovie -> {
                    existingMovie.setTitle(updatedMovie.getTitle());
                    existingMovie.setDescription(updatedMovie.getDescription());
                    existingMovie.setGenre(updatedMovie.getGenre());
                    existingMovie.setLanguage(updatedMovie.getLanguage());
                    existingMovie.setDirector(updatedMovie.getDirector());
                    existingMovie.setCast(updatedMovie.getCast());
                    existingMovie.setDuration(updatedMovie.getDuration());
                    existingMovie.setReleaseDate(updatedMovie.getReleaseDate());
                    existingMovie.setRating(updatedMovie.getRating());
                    existingMovie.setPosterUrl(updatedMovie.getPosterUrl());
                    existingMovie.setStatus(updatedMovie.getStatus());
                    return movieRepository.save(existingMovie);
                })
                .orElseThrow(() -> new RuntimeException("Movie not found with id: " + id));
    }

    public void deleteMovie(String id) {
        movieRepository.deleteById(id);
    }
}
