package org.upyog.rs.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.Valid;
import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TripHistory {
    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("tripId")
    private String tripId;

    @JsonProperty("driverId")
    private String driverId;

    @JsonProperty("vehicleId")
    private String vehicleId;

    @JsonProperty("bookingNo")
    private String bookingNo;

    @JsonProperty("startTime")
    private Long startTime;

    @JsonProperty("endTime")
    private Long endTime;

    @JsonProperty("startFileStoreId")
    private String startFileStoreId;
    @JsonProperty("endFileStoreId")
    private String endFileStoreId;

    @JsonProperty("totalDistanceMeters")
    private Double totalDistanceMeters;

    @Builder.Default
    @JsonProperty("businessService")
    private String businessService = "WT.TRIP-HISTORY";

    @Builder.Default
    @JsonProperty("status")
    private String status = "COMPLETED";

    @JsonProperty("additionalDetails")
    private AdditionalDetails additionalDetails;

    @Valid
    @JsonProperty("routePoints")
    private List<RoutePoint> routePoints;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

}