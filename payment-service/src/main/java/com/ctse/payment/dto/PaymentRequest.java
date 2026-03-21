package com.ctse.payment.dto;

import com.ctse.payment.model.PaymentMethod;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {

    @NotBlank
    private String bookingId;

    /** Optional for guest checkout */
    private String userId;

    /** Required for guest checkout; auto-filled for registered users when possible */
    private String ticketEmail;

    private String guestName;

    /** When set, server verifies Stripe Checkout Session and finalizes payment */
    private String stripeCheckoutSessionId;

    /** Required when initiating Stripe Checkout via POST /payments */
    private String successUrl;

    private String cancelUrl;

    @NotNull
    @Min(1)
    private BigDecimal amount;

    @NotNull
    private PaymentMethod paymentMethod;
}
