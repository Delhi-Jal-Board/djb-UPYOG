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
public class InspectionType {
    @JsonProperty("code")
    private String code;

    @JsonProperty("i18nKey")
    private String i18nKey;

}
