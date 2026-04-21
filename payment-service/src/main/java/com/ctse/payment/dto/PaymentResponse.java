package com.ctse.payment.dto;

import com.ctse.payment.model.PaymentMethod;
import com.ctse.payment.model.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class PaymentResponse {

    private String paymentId;
    private String bookingId;
    private String userId;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String transactionReference;
    private String gateway;
    private boolean refunded;
    private String refundId;
    private Instant createdAt;
    private Instant updatedAt;

    /** Set when Stripe Checkout Session is created (client redirects) */
    private String checkoutUrl;

    private String ticketCode;
    private String ticketShowId;
    private List<String> ticketSeats;
    private String guestName;
}
