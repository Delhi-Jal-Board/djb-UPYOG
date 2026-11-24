package org.egov.persistence.contract;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class OtpRequest {
    private Otp otp;

    public OtpRequest(org.egov.domain.model.OtpRequest otpRequest) {
        String identity = otpRequest.isEmailVerificationRequestType()
                ? otpRequest.getEmail()
                : otpRequest.getMobileNumber();
        this.otp = Otp.builder()
                .tenantId(otpRequest.getTenantId())
                .identity(identity)
                .build();
    }
}


