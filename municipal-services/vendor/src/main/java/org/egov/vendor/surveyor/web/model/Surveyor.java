package org.egov.vendor.surveyor.web.model;

import javax.validation.Valid;
import javax.validation.constraints.Size;

import org.egov.vendor.web.model.AuditDetails;
import org.egov.vendor.web.model.user.User;
import org.hibernate.validator.constraints.SafeHtml;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Validated
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class Surveyor {

    @SafeHtml
    @JsonProperty("id")
    private String id = null;

    @JsonProperty("tenantId")
    @SafeHtml
    @Size(max = 64)
    private String tenantId = null;

    @JsonProperty("vendorId")
    @SafeHtml
    @Size(max = 256)
    private String vendorId = null;

    @JsonProperty("name")
    @SafeHtml
    @Size(max = 128)
    private String name = null;

    @JsonProperty("mobileNo")
    @SafeHtml
    @Size(max = 20)
    private String mobileNo = null;

    @JsonProperty("supervisorId")
    @SafeHtml
    @Size(max = 256)
    private String supervisorId = null;

    @JsonProperty("correspondenceAddress")
    @SafeHtml
    @Size(max = 500)
    private String correspondenceAddress = null;

    @JsonProperty("owner")
    @Valid
    private User owner = null;

    @JsonProperty("ownerId")
    @SafeHtml
    @Size(max = 64)
    private String ownerId = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @SafeHtml
    @JsonProperty("description")
    private String description = null;

    public enum StatusEnum {
        ACTIVE("ACTIVE"),
        INACTIVE("INACTIVE"),
        DISABLED("DISABLED");

        private String value;

        StatusEnum(String value) {
            this.value = value;
        }

        @Override
        @JsonValue
        public String toString() {
            return String.valueOf(value);
        }

        @JsonCreator
        public static StatusEnum fromValue(String text) {
            for (StatusEnum b : StatusEnum.values()) {
                if (String.valueOf(b.value).equals(text)) {
                    return b;
                }
            }
            return null;
        }
    }

    @JsonProperty("status")
    private StatusEnum status = null;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails = null;

    // ── Joined fields — populated on search, read-only ──────────────
    @JsonProperty("supervisorName")
    private String supervisorName = null;

    @JsonProperty("vendorName")
    private String vendorName = null;
}