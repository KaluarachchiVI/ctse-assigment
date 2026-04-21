package com.ctse.payment.service;

import com.ctse.payment.dto.PaymentRequest;
import com.ctse.payment.dto.PaymentResponse;
import com.ctse.payment.dto.RefundRequest;

import java.util.List;

public interface PaymentService {

    default PaymentResponse processPayment(PaymentRequest request) {
        return processPayment(request, null);
    }

    /**
     * @param authorization the caller's raw {@code Authorization} header (may be null),
     *                      forwarded to user-service when verifying a registered user.
     */
    PaymentResponse processPayment(PaymentRequest request, String authorization);

    PaymentResponse getPaymentById(String paymentId);

    List<PaymentResponse> getPaymentsByBookingId(String bookingId);

    PaymentResponse refundPayment(RefundRequest request);
}
