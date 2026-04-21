package com.ctse.payment.service;

import com.ctse.payment.dto.StripeCheckoutSessionRequest;
import com.ctse.payment.dto.StripeCheckoutSessionResponse;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class StripeCheckoutService {

    @Value("${payment.gateway.stripe.api-key:}")
    private String stripeApiKey;

    @Value("${payment.gateway.stripe.checkout-currency:usd}")
    private String checkoutCurrency;

    public StripeCheckoutSessionResponse createCheckoutSession(StripeCheckoutSessionRequest request) {
        if (stripeApiKey == null || stripeApiKey.isBlank() || stripeApiKey.equals("dummy")) {
            throw new IllegalArgumentException(
                    "Stripe API key is missing or placeholder. Set STRIPE_API_KEY to your sk_test_... or sk_live_... key (not \"dummy\")."
            );
        }

        try {
            Stripe.apiKey = stripeApiKey;

            long amountInCents = request.getAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.HALF_UP)
                    .longValueExact();

            String currency = checkoutCurrency == null || checkoutCurrency.isBlank()
                    ? "lkr"
                    : checkoutCurrency.trim().toLowerCase();

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(request.getSuccessUrl())
                    .setCancelUrl(request.getCancelUrl())
                    .setCustomerEmail(request.getTicketEmail())
                    .putMetadata("bookingId", request.getBookingId())
                    .putMetadata("userId", request.getUserId() == null ? "" : request.getUserId())
                    .putMetadata("ticketEmail", request.getTicketEmail())
                    .putMetadata("guestName", request.getGuestName() == null ? "" : request.getGuestName())
                    .putMetadata("amount", request.getAmount().toPlainString())
                    .putMetadata("paymentMethod", request.getPaymentMethod().name())
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency(currency)
                                                    .setUnitAmount(amountInCents)
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Motion Pictures Ticket")
                                                                    .setDescription("Booking " + request.getBookingId())
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            Session session = Session.create(params);
            return StripeCheckoutSessionResponse.builder()
                    .sessionId(session.getId())
                    .checkoutUrl(session.getUrl())
                    .build();
        } catch (StripeException e) {
            String detail = e.getStripeError() != null && e.getStripeError().getMessage() != null
                    ? e.getStripeError().getMessage()
                    : e.getMessage();
            String code = e.getStripeError() != null && e.getStripeError().getCode() != null
                    ? e.getStripeError().getCode()
                    : e.getCode();
            throw new IllegalStateException(
                    "Stripe checkout session failed"
                            + (code != null ? " [" + code + "]" : "")
                            + ": "
                            + detail
                            + ". Check STRIPE_API_KEY, that the currency is enabled for your account (STRIPE_CHECKOUT_CURRENCY), and the charge amount meets Stripe minimums.",
                    e
            );
        }
    }

    public Session retrieveCheckoutSession(String sessionId) {
        if (stripeApiKey == null || stripeApiKey.isBlank() || stripeApiKey.equals("dummy")) {
            throw new IllegalArgumentException("Stripe API key is missing. Set STRIPE_API_KEY.");
        }
        try {
            Stripe.apiKey = stripeApiKey;
            return Session.retrieve(sessionId);
        } catch (StripeException e) {
            throw new IllegalStateException("Failed to retrieve Stripe checkout session: " + e.getMessage(), e);
        }
    }
}
