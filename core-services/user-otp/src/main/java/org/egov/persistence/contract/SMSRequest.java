package org.egov.persistence.contract;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.egov.domain.model.Category;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SMSRequest {
    private String mobileNumber;
    private String message;
    private Category category;
    private long expiryTime;
    private String templateId;
    private String[] users;

    public SMSRequest(String mobileNumber, String message, Category category, long expiryTime) {
        this.mobileNumber = mobileNumber;
        this.message = message;
        this.category = category;
        this.expiryTime = expiryTime;
    }
}