package com.ctse.payment.repository;

import com.ctse.payment.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends MongoRepository<Payment, String> {

    @Override
    @NonNull
    <S extends Payment> S save(@NonNull S entity);

    Optional<Payment> findFirstByBookingIdAndStatusIn(String bookingId, Iterable<com.ctse.payment.model.PaymentStatus> statuses);

    List<Payment> findByBookingId(String bookingId);

    Optional<Payment> findByTransactionReference(String transactionReference);
}

