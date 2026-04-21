package com.ctse.payment.service;

import com.ctse.payment.dto.PaymentRequest;
import com.ctse.payment.dto.PaymentResponse;
import com.ctse.payment.dto.RefundRequest;

import java.util.List;

public interface PaymentService {

    PaymentResponse processPayment(PaymentRequest request);

    PaymentResponse getPaymentById(String paymentId);

    List<PaymentResponse> getPaymentsByBookingId(String bookingId);

    PaymentResponse refundPayment(RefundRequest request);
}
