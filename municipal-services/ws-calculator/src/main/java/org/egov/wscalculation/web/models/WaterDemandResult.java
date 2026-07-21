package org.egov.wscalculation.web.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaterDemandResult {
    private BigDecimal calculatedOccupancy;
    private BigDecimal chosenLpcd;
    private BigDecimal baseDemand;
    private BigDecimal contingencyPercentage;
    private BigDecimal totalWaterDemand;

    private String matchedNormCode;
    private String formulaUsed;
    private String calculationBasisApplied;
    private Map<String, BigDecimal> contextVariables;
	public BigDecimal getCalculatedOccupancy() {
		return calculatedOccupancy;
	}
	public void setCalculatedOccupancy(BigDecimal calculatedOccupancy) {
		this.calculatedOccupancy = calculatedOccupancy;
	}
	public BigDecimal getChosenLpcd() {
		return chosenLpcd;
	}
	public void setChosenLpcd(BigDecimal chosenLpcd) {
		this.chosenLpcd = chosenLpcd;
	}
	public BigDecimal getBaseDemand() {
		return baseDemand;
	}
	public void setBaseDemand(BigDecimal baseDemand) {
		this.baseDemand = baseDemand;
	}
	public BigDecimal getContingencyPercentage() {
		return contingencyPercentage;
	}
	public void setContingencyPercentage(BigDecimal contingencyPercentage) {
		this.contingencyPercentage = contingencyPercentage;
	}
	public BigDecimal getTotalWaterDemand() {
		return totalWaterDemand;
	}
	public void setTotalWaterDemand(BigDecimal totalWaterDemand) {
		this.totalWaterDemand = totalWaterDemand;
	}
	public String getMatchedNormCode() {
		return matchedNormCode;
	}
	public void setMatchedNormCode(String matchedNormCode) {
		this.matchedNormCode = matchedNormCode;
	}
	public String getFormulaUsed() {
		return formulaUsed;
	}
	public void setFormulaUsed(String formulaUsed) {
		this.formulaUsed = formulaUsed;
	}
	public String getCalculationBasisApplied() {
		return calculationBasisApplied;
	}
	public void setCalculationBasisApplied(String calculationBasisApplied) {
		this.calculationBasisApplied = calculationBasisApplied;
	}
	public Map<String, BigDecimal> getContextVariables() {
		return contextVariables;
	}
	public void setContextVariables(Map<String, BigDecimal> contextVariables) {
		this.contextVariables = contextVariables;
	}
    
    
    
}