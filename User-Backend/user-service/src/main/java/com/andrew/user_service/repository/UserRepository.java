package com.andrew.user_service.repository;

import com.andrew.user_service.model.Usermodel;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepository extends MongoRepository<Usermodel, String> {
    Optional<Usermodel> findByEmail(String email);
}
