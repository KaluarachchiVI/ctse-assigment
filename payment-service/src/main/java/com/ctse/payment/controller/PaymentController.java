package com.ctse.payment.controller;

import com.ctse.payment.dto.PaymentRequest;
import com.ctse.payment.dto.PaymentResponse;
import com.ctse.payment.dto.RefundRequest;
import com.ctse.payment.dto.StripeCheckoutSessionRequest;
import com.ctse.payment.dto.StripeCheckoutSessionResponse;
import com.ctse.payment.dto.TicketResponse;
import com.ctse.payment.model.Payment;
import com.ctse.payment.model.PaymentStatus;
import com.ctse.payment.repository.PaymentRepository;
import com.ctse.payment.service.PaymentService;
import com.ctse.payment.service.StripeCheckoutService;
import com.ctse.payment.client.BookingClient;
import com.ctse.payment.service.EmailService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment Service APIs")
public class PaymentController {

    private final PaymentService paymentService;
    private final StripeCheckoutService stripeCheckoutService;
    private final PaymentRepository paymentRepository;
    private final BookingClient bookingClient;
    private final EmailService emailService;

    @Value("${STRIPE_WEBHOOK_SECRET:}")
    private String stripeWebhookSecret;

    @PostMapping
    @Operation(summary = "Process payment for a booking")
    public ResponseEntity<PaymentResponse> processPayment(
            @Valid @RequestBody PaymentRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        PaymentResponse response = paymentService.processPayment(request, authorization);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/checkout-session")
    @Operation(summary = "Create Stripe Checkout Session")
    public ResponseEntity<StripeCheckoutSessionResponse> createCheckoutSession(
            @Valid @RequestBody StripeCheckoutSessionRequest request
    ) {
        StripeCheckoutSessionResponse response = stripeCheckoutService.createCheckoutSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/webhook/stripe")
    @Operation(summary = "Handle Stripe webhook events")
    public ResponseEntity<String> stripeWebhook(
            @RequestHeader(value = "Stripe-Signature", required = false) String stripeSignature,
            @RequestBody String payload
    ) {
        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("STRIPE_WEBHOOK_SECRET is not configured");
        }
        if (stripeSignature == null || stripeSignature.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Missing Stripe-Signature header");
        }

        final Event event;
        try {
            event = Webhook.constructEvent(payload, stripeSignature, stripeWebhookSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid webhook signature");
        }

        if (!"checkout.session.completed".equals(event.getType())) {
            return ResponseEntity.ok("ignored");
        }

        Session session = (Session) event.getDataObjectDeserializer()
                .getObject()
                .orElse(null);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Session payload missing");
        }

        String bookingId = session.getMetadata().get("bookingId");
        String userId = session.getMetadata().get("userId");
        String ticketEmail = session.getMetadata().get("ticketEmail");
        String guestName = session.getMetadata().get("guestName");
        String amountRaw = session.getMetadata().get("amount");
        String paymentMethodRaw = session.getMetadata().get("paymentMethod");
        String txRef = session.getId();

        if (bookingId == null || bookingId.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("bookingId missing in metadata");
        }

        var existingOpt = paymentRepository.findByTransactionReference(txRef);
        if (existingOpt.isPresent() && existingOpt.get().getStatus() != PaymentStatus.PENDING) {
            return ResponseEntity.ok("already_processed");
        }

        Payment payment;
        if (existingOpt.isPresent()) {
            Payment existing = existingOpt.get();
            existing.setStatus(PaymentStatus.SUCCESS);
            existing.setGateway("STRIPE");
            existing.setTransactionReference(txRef);
            payment = paymentRepository.save(existing);
        } else {
            payment = Payment.builder()
                    .bookingId(bookingId)
                    .userId(userId == null || userId.isBlank() ? null : userId)
                    .amount(amountRaw == null || amountRaw.isBlank() ? BigDecimal.ONE : new BigDecimal(amountRaw))
                    .paymentMethod(paymentMethodRaw == null || paymentMethodRaw.isBlank()
                            ? com.ctse.payment.model.PaymentMethod.CARD
                            : com.ctse.payment.model.PaymentMethod.valueOf(paymentMethodRaw))
                    .status(PaymentStatus.SUCCESS)
                    .gateway("STRIPE")
                    .transactionReference(txRef)
                    .build();
            paymentRepository.save(java.util.Objects.requireNonNull(payment));
        }

        bookingClient.updateBookingStatus(bookingId, "CONFIRMED");
        TicketResponse issued = null;
        try {
            issued = bookingClient.issueTicket(bookingId, ticketEmail, guestName);
            try {
                emailService.sendTicketEmail(
                        ticketEmail,
                        issued.getTicketCode(),
                        issued.getShowId(),
                        issued.getSeats(),
                        issued.getGuestName()
                );
            } catch (Exception ignored) {
                // Ticket is still issued even if email delivery fails.
            }
        } catch (Exception ignored) {
            // Webhook processing should not fail if ticket issuance endpoints are not present.
        }

        return ResponseEntity.ok("processed");
    }

    @GetMapping("/{paymentId}")
    @Operation(summary = "Get payment by ID")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable("paymentId") String paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId));
    }

    @GetMapping("/booking/{bookingId}")
    @Operation(summary = "Get payments by booking ID")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByBooking(@PathVariable("bookingId") String bookingId) {
        return ResponseEntity.ok(paymentService.getPaymentsByBookingId(bookingId));
    }

    @PostMapping("/refund")
    @Operation(summary = "Refund payment for a booking")
    public ResponseEntity<PaymentResponse> refund(@Valid @RequestBody RefundRequest request) {
        return ResponseEntity.ok(paymentService.refundPayment(request));
    }
}

