package org.egov.waterconnection.web.models;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Persisted assessment metadata for infrastructure-charge reconciliation. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InfrastructureChargeAssessment {
    private String tenantId;
    private String applicationNo;
    private String propertyId;
    private String inputFingerprint;
    private String inputSnapshot;
    private BigDecimal assessedIfcAmount;
    private BigDecimal lastEstimatedIfcAmount;
    private BigDecimal pendingAdditionalAmount;
    private String status;
    private Integer assessmentVersion;
    private String createdBy;
    private Long createdTime;
    private String lastModifiedBy;
    private Long lastModifiedTime;
}
