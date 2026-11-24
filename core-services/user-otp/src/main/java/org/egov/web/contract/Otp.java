package org.egov.web.contract;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.egov.domain.model.OtpRequestType;

import static org.apache.commons.lang3.StringUtils.isEmpty;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Setter
@ToString
public class Otp {
    private static final String USER_REGISTRATION = "register";
    private static final String PASSWORD_RESET = "passwordreset";
    private static final String USER_LOGIN = "login";
    private static final String EKYC = "ekyc";
    private static final String EMAIL_VERIFICATION = "email_verification";
    private static final String EMAIL = "email";
    private String mobileNumber;
    private String tenantId;
    private String type;
    private String userType;
    private String name;
    private String email;

    public Otp(String mobileNumber, String tenantId, String type, String userType, String name) {
        this.mobileNumber = mobileNumber;
        this.tenantId = tenantId;
        this.type = type;
        this.userType = userType;
        this.name = name;
    }

    @JsonIgnore
    public OtpRequestType getTypeOrDefault() {
        return isEmpty(type) ? OtpRequestType.REGISTER : mapToDomainType();
    }

    private OtpRequestType mapToDomainType() {
        if (USER_REGISTRATION.equalsIgnoreCase(type)) {
            return OtpRequestType.REGISTER;
        } else if (USER_LOGIN.equalsIgnoreCase(type)) {
            return OtpRequestType.LOGIN;
        } else if (PASSWORD_RESET.equalsIgnoreCase(type)) {
            return OtpRequestType.PASSWORD_RESET;
        } else if (EKYC.equalsIgnoreCase(type)) {
            return OtpRequestType.EKYC;
        } else if (EMAIL_VERIFICATION.equalsIgnoreCase(type) || EMAIL.equalsIgnoreCase(type)) {
            return OtpRequestType.EMAIL_VERIFICATION;
        }
        return null;
    }
}

