package org.upyog.rs.web.models.waterTanker;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@ToString
public class WaterTankerFixedPointBookingSearchCriteria {

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("mobileNumber")
    private String mobileNumber;

    @JsonProperty("name")
    private String name;

    @JsonProperty("limit")
    private Integer limit;

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("fromDate")
    private Long fromDate;

    @JsonProperty("toDate")
    private Long toDate;

    @JsonProperty("fillingPointId")
    private String fillingPointId;

    @JsonProperty("id")
    private String id;

    @JsonProperty("fixedPointId")
    private String fixedPointId;

    @JsonProperty("createdBy")
    private List<String> createdBy;

    @JsonProperty("vendorIds")
    private List<String> vendorIds;

}
