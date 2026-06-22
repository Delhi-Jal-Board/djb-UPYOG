package org.egov.pt.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plot {

    @JsonProperty("id")
    private String id;

    @JsonProperty("plotId")
    private String plotId;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("plotNo")
    private String plotNo;

    @JsonProperty("doorNo")
    private String doorNo;

    @JsonProperty("buildingName")
    private String buildingName;

    @JsonProperty("street")
    private String street;

    @JsonProperty("locality")
    private String locality;

    @JsonProperty("subLocality")
    private String subLocality;

    @JsonProperty("addressHash")
    private String addressHash;

    @JsonProperty("additionalDetails")
    private JsonNode additionalDetails;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}