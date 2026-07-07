package org.egov.waterconnection.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InspectionInformation {
    
    @JsonProperty("inspectionType")
    private InspectionType inspectionType;

    @JsonProperty("inspectionDate")
    private Long inspectionDate;

    @JsonProperty("inspectorName")
    private String inspectorName;
}
