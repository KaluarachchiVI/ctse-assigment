package com.ctse.payment.service.impl;

import com.ctse.payment.client.BookingClient;
import com.ctse.payment.client.UserClient;
import com.ctse.payment.dto.PaymentRequest;
import com.ctse.payment.dto.PaymentResponse;
import com.ctse.payment.dto.StripeCheckoutSessionRequest;
import com.ctse.payment.dto.RefundRequest;
import com.ctse.payment.dto.TicketResponse;
import com.ctse.payment.gateway.PaymentGatewayClient;
import com.ctse.payment.service.EmailService;
import com.ctse.payment.service.StripeCheckoutService;
import com.ctse.payment.model.PaymentMethod;
import com.ctse.payment.model.Payment;
import com.ctse.payment.model.PaymentStatus;
import com.ctse.payment.repository.PaymentRepository;
import com.ctse.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.stripe.model.checkout.Session;

import java.math.BigDecimal;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentRepository paymentRepository;
    private final PaymentGatewayClient paymentGatewayClient;
    private final BookingClient bookingClient;
    private final UserClient userClient;
    private final EmailService emailService;
    private final StripeCheckoutService stripeCheckoutService;

    @Value("${payment.gateway.provider:mock}")
    private String paymentGatewayProvider;

    @Override
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        // Stripe success flow:
        // If stripeCheckoutSessionId is provided, treat this as a server-side finalization request.
        if (!isBlank(request.getStripeCheckoutSessionId())) {
            return finalizeStripeCheckout(request);
        }

        // Stripe initiation flow:
        // If configured, create a Stripe Checkout Session and return the checkoutUrl for redirect.
        if (shouldUseStripeCheckout()) {
            return initiateStripeCheckout(request);
        }

        // Default assignment flow (mock gateway): create PENDING payment and charge immediately.
        String ticketEmail = null;
        String guestName = null;
        boolean doTicketing;

        boolean hasUserId = request.getUserId() != null && !request.getUserId().isBlank();
        if (!hasUserId) {
            // Guest checkout: ticketing inputs are mandatory.
            if (isBlank(request.getTicketEmail()) || isBlank(request.getGuestName())) {
                throw new IllegalArgumentException("Missing ticketEmail and guestName for guest checkout");
            }
            ticketEmail = request.getTicketEmail();
            guestName = request.getGuestName();
            doTicketing = true;
        } else {
            // Registered checkout: verify user exists (and attempt to auto-fill ticket fields).
            if (!userClient.userExists(request.getUserId())) {
                throw new IllegalArgumentException("User not found: " + request.getUserId());
            }

            UserClient.UserProfile profile = userClient.fetchUserProfile(request.getUserId());
            ticketEmail = profile.getEmail().orElse(request.getTicketEmail());
            guestName = profile.getName().orElse(request.getGuestName());

            // If the other group's User service doesn't expose email/name, we skip ticketing.
            doTicketing = !isBlank(ticketEmail) && !isBlank(guestName);
            if (!doTicketing) {
                log.warn("Ticketing skipped for bookingId={} because user email/name could not be resolved (userId={})",
                        request.getBookingId(), request.getUserId());
            }
        }

        Payment payment = Payment.builder()
                .bookingId(request.getBookingId())
                .userId(request.getUserId())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.PENDING)
                .gateway("MOCK")
                .build();

        @SuppressWarnings("null")
        Payment saved = paymentRepository.save(java.util.Objects.requireNonNull(payment));

        // Delegate to payment gateway (mock or real) to perform charge
        Payment charged = paymentGatewayClient.charge(saved);
        @SuppressWarnings("null")
        Payment persistedCharged = paymentRepository.save(charged);
        charged = persistedCharged;

        // Notify booking service about outcome
        if (charged.getStatus() == PaymentStatus.SUCCESS) {
            bookingClient.updateBookingStatus(charged.getBookingId(), "CONFIRMED");

            PaymentResponse response = toResponse(charged);
            if (doTicketing) {
                TicketResponse issued = null;
                try {
                    // Issue ticket (best-effort for the assignment contract).
                    issued = bookingClient.issueTicket(charged.getBookingId(), ticketEmail, guestName);
                    response.setTicketCode(issued.getTicketCode());
                    response.setTicketShowId(issued.getShowId());
                    response.setTicketSeats(issued.getSeats());
                    response.setGuestName(issued.getGuestName());
                } catch (Exception ex) {
                    log.warn("Ticket issuance failed for bookingId={} (paymentId={}): {}", charged.getBookingId(), charged.getId(), ex.getMessage());
                }

                if (issued != null) {
                    try {
                        emailService.sendTicketEmail(
                                ticketEmail,
                                issued.getTicketCode(),
                                issued.getShowId(),
                                issued.getSeats(),
                                guestName
                        );
                    } catch (Exception ex) {
                        // Don't fail payment if email sending fails.
                    }
                }
            }

            return response;
        } else {
            // Assignment contract: FAILED represents payment failure.
            bookingClient.updateBookingStatus(charged.getBookingId(), "FAILED");
        }
        return toResponse(charged);
    }

    private boolean shouldUseStripeCheckout() {
        if (paymentGatewayProvider == null) {
            return false;
        }
        String normalized = paymentGatewayProvider.trim().toLowerCase();
        return normalized.equals("stripe-checkout") || normalized.equals("stripe") || normalized.startsWith("stripe");
    }

    private PaymentResponse initiateStripeCheckout(PaymentRequest request) {
        String ticketEmail;
        String guestName;
        boolean hasUserId = request.getUserId() != null && !request.getUserId().isBlank();

        // Ticketing fields handling:
        // - Guest checkout requires both ticketEmail and guestName.
        // - Registered checkout verifies user and attempts to auto-fill email/name from User service.
        if (!hasUserId) {
            if (isBlank(request.getTicketEmail()) || isBlank(request.getGuestName())) {
                throw new IllegalArgumentException("Missing ticketEmail and guestName for guest checkout");
            }
            ticketEmail = request.getTicketEmail();
            guestName = request.getGuestName();
        } else {
            if (!userClient.userExists(request.getUserId())) {
                throw new IllegalArgumentException("User not found: " + request.getUserId());
            }

            UserClient.UserProfile profile = userClient.fetchUserProfile(request.getUserId());
            ticketEmail = profile.getEmail().orElse(request.getTicketEmail());
            guestName = profile.getName().orElse(request.getGuestName());
        }

        // Stripe checkout requires a non-empty ticketEmail.
        if (isBlank(ticketEmail)) {
            throw new IllegalArgumentException("ticketEmail is required to initiate Stripe checkout");
        }

        if (isBlank(request.getSuccessUrl()) || isBlank(request.getCancelUrl())) {
            throw new IllegalArgumentException("successUrl and cancelUrl are required to initiate Stripe checkout");
        }

        StripeCheckoutSessionRequest stripeRequest = new StripeCheckoutSessionRequest();
        stripeRequest.setBookingId(request.getBookingId());
        stripeRequest.setUserId(request.getUserId());
        stripeRequest.setTicketEmail(ticketEmail);
        stripeRequest.setGuestName(guestName);
        stripeRequest.setAmount(request.getAmount());
        stripeRequest.setPaymentMethod(request.getPaymentMethod());
        stripeRequest.setSuccessUrl(request.getSuccessUrl());
        stripeRequest.setCancelUrl(request.getCancelUrl());

        var stripeSession = stripeCheckoutService.createCheckoutSession(stripeRequest);

        Payment payment = Payment.builder()
                .bookingId(request.getBookingId())
                .userId(request.getUserId())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.PENDING)
                .gateway("STRIPE")
                .transactionReference(stripeSession.getSessionId())
                .build();

        Payment saved = paymentRepository.save(java.util.Objects.requireNonNull(payment));
        PaymentResponse response = toResponse(saved);
        response.setCheckoutUrl(stripeSession.getCheckoutUrl());
        return response;
    }

    private PaymentResponse finalizeStripeCheckout(PaymentRequest request) {
        String sessionId = request.getStripeCheckoutSessionId();
        Session stripeSession = stripeCheckoutService.retrieveCheckoutSession(sessionId);
        Map<String, String> metadata = stripeSession.getMetadata();

        String bookingId = metadata != null ? metadata.get("bookingId") : request.getBookingId();
        String userId = metadata != null ? metadata.get("userId") : request.getUserId();
        String ticketEmail = metadata != null ? metadata.get("ticketEmail") : request.getTicketEmail();
        String guestName = metadata != null ? metadata.get("guestName") : request.getGuestName();

        String amountRaw = metadata != null ? metadata.get("amount") : null;
        String paymentMethodRaw = metadata != null ? metadata.get("paymentMethod") : null;

        BigDecimal amount = request.getAmount();
        if (!isBlank(amountRaw)) {
            amount = new BigDecimal(amountRaw);
        }

        PaymentMethod paymentMethod = request.getPaymentMethod();
        if (!isBlank(paymentMethodRaw)) {
            paymentMethod = PaymentMethod.valueOf(paymentMethodRaw);
        }

        boolean paid = "paid".equalsIgnoreCase(stripeSession.getPaymentStatus());
        PaymentStatus targetStatus = paid ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

        if (!isBlank(userId) && userId.trim().isEmpty()) {
            userId = null;
        }

        // Idempotency: if already processed (terminal status), avoid duplicating side effects.
        var existingOpt = paymentRepository.findByTransactionReference(sessionId);
        if (existingOpt.isPresent()) {
            Payment existing = existingOpt.get();
            if (existing.getStatus() != PaymentStatus.PENDING) {
                return toResponse(existing);
            }

            existing.setStatus(targetStatus);
            existing.setGateway("STRIPE");
            existing.setTransactionReference(sessionId);
            Payment savedExisting = paymentRepository.save(existing);
            // continue to side effects below (ticketing/booking update) since it was PENDING
            return applyStripeFinalizationSideEffects(savedExisting, bookingId, ticketEmail, guestName, targetStatus);
        }

        Payment payment = Payment.builder()
                .bookingId(bookingId)
                .userId(userId)
                .amount(amount)
                .paymentMethod(paymentMethod)
                .status(targetStatus)
                .gateway("STRIPE")
                .transactionReference(sessionId)
                .build();

        Payment saved = paymentRepository.save(java.util.Objects.requireNonNull(payment));
        return applyStripeFinalizationSideEffects(saved, bookingId, ticketEmail, guestName, targetStatus);
    }

    private PaymentResponse applyStripeFinalizationSideEffects(
            Payment saved,
            String bookingId,
            String ticketEmail,
            String guestName,
            PaymentStatus targetStatus
    ) {
        bookingClient.updateBookingStatus(bookingId, targetStatus == PaymentStatus.SUCCESS ? "CONFIRMED" : "FAILED");

        if (targetStatus != PaymentStatus.SUCCESS) {
            return toResponse(saved);
        }

        PaymentResponse response = toResponse(saved);
        if (isBlank(ticketEmail)) {
            // Ticketing needs email; still mark booking as confirmed.
            return response;
        }

        try {
            TicketResponse issued = bookingClient.issueTicket(bookingId, ticketEmail, guestName);
            response.setTicketCode(issued.getTicketCode());
            response.setTicketShowId(issued.getShowId());
            response.setTicketSeats(issued.getSeats());
            response.setGuestName(issued.getGuestName());

            try {
                emailService.sendTicketEmail(
                        ticketEmail,
                        issued.getTicketCode(),
                        issued.getShowId(),
                        issued.getSeats(),
                        guestName
                );
            } catch (Exception ignored) {
                // Don't fail confirmation if email sending fails.
            }
        } catch (Exception ex) {
            log.warn("Stripe ticket issuance failed for bookingId={} (paymentId={}): {}", bookingId, saved.getId(), ex.getMessage());
        }

        return response;
    }

    @Override
    public PaymentResponse getPaymentById(String paymentId) {
        @SuppressWarnings("null")
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for id: " + paymentId));
        return toResponse(payment);
    }

    @Override
    public List<PaymentResponse> getPaymentsByBookingId(String bookingId) {
        return paymentRepository.findByBookingId(bookingId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PaymentResponse refundPayment(RefundRequest request) {
        Payment payment = paymentRepository
                .findFirstByBookingIdAndStatusIn(
                        request.getBookingId(),
                        Set.of(PaymentStatus.SUCCESS, PaymentStatus.REFUNDED)
                )
                .orElseThrow(() -> new IllegalArgumentException("No successful payment found for booking: " + request.getBookingId()));

        Payment refunded = paymentGatewayClient.refund(payment);
        @SuppressWarnings("null")
        Payment saved = paymentRepository.save(refunded);

        // Notify booking service if needed (e.g., CANCELLED)
        bookingClient.updateBookingStatus(saved.getBookingId(), "CANCELLED");

        return toResponse(saved);
    }

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .paymentId(payment.getId())
                .bookingId(payment.getBookingId())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .transactionReference(payment.getTransactionReference())
                .gateway(payment.getGateway())
                .refunded(payment.isRefunded())
                .refundId(payment.getRefundId())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}

