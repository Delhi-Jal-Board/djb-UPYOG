package org.egov.wscalculation.web.models;

import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InfrastructureChargeDetail {

    @JsonProperty("colonyCategory")
    private String colonyCategory;

    @JsonProperty("plotArea")
    private BigDecimal plotArea;

    @JsonProperty("minimumPlotArea")
    private BigDecimal minimumPlotArea;

    @JsonProperty("waterRatePerLPD")
    private BigDecimal waterRatePerLPD;

    @JsonProperty("sewerRatePerLPD")
    private BigDecimal sewerRatePerLPD;

    @JsonProperty("waterComponentIFC")
    private BigDecimal waterComponentIFC;

    @JsonProperty("sewerComponentIFC")
    private BigDecimal sewerComponentIFC;

    @JsonProperty("grossIFC")
    private BigDecimal grossIFC;

    @JsonProperty("rebatePercentage")
    private BigDecimal rebatePercentage;

    @JsonProperty("rebateAmount")
    private BigDecimal rebateAmount;

    @JsonProperty("netIFC")
    private BigDecimal netIFC;
}