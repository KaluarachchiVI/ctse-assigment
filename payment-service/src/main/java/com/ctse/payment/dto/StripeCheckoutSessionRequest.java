package com.ctse.payment.dto;

import com.ctse.payment.model.PaymentMethod;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StripeCheckoutSessionRequest {
    @NotBlank
    private String bookingId;

    private String userId;

    @NotBlank
    private String ticketEmail;

    private String guestName;

    @NotNull
    @Min(1)
    private BigDecimal amount;

    @NotNull
    private PaymentMethod paymentMethod;

    @NotBlank
    private String successUrl;

    @NotBlank
    private String cancelUrl;
}
