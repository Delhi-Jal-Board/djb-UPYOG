package org.egov.wscalculation.service.strategy.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

import org.egov.wscalculation.constants.WSCalculationConstant;
import org.egov.wscalculation.service.strategy.GroupDemandStrategy;
import org.egov.wscalculation.web.models.WaterDemandResult;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class GroupCDemandStrategy implements GroupDemandStrategy {

    @Override
    public boolean supports(String subCategoryCode, String parentUsageCode) {
        if (subCategoryCode == null) return false;
        return subCategoryCode.startsWith("C-") || "INSTITUTIONAL".equalsIgnoreCase(parentUsageCode) || "HOSPITAL".equalsIgnoreCase(parentUsageCode);
    }

    @Override
    public void processGroupDemand(WaterDemandResult result, Map<String, Object> matchedNorm, Map<String, BigDecimal> contextVariables) {
        log.info("Executing Group C (Institutional & Hospitals) Demand Calculation Logic");

        String code = result.getMatchedNormCode();
        BigDecimal occupancy = result.getCalculatedOccupancy();

        BigDecimal totalLpcd = getBigDecimal(matchedNorm, "totalLpcd");
        BigDecimal potableLpcd = getBigDecimal(matchedNorm, "potableLpcd");

        // C-1 Dynamic Bed Threshold Rule Logic
        if (code != null && (code.startsWith("C-1") || code.contains("HOSPITAL"))) {
            if (occupancy.compareTo(new BigDecimal("100")) <= 0) {
                totalLpcd = new BigDecimal("340");
                potableLpcd = new BigDecimal("250");
                log.info("Hospital Bed Count <= 100. Applied Rates: Total={}, Potable={}", totalLpcd, potableLpcd);
            } else {
                totalLpcd = new BigDecimal("450");
                potableLpcd = new BigDecimal("360");
                log.info("Hospital Bed Count > 100. Applied Rates: Total={}, Potable={}", totalLpcd, potableLpcd);
            }
        }

        BigDecimal contingencyPct = getBigDecimal(matchedNorm, "contingencyPercentage");
        BigDecimal contingencyMultiplier = BigDecimal.ONE;
        if (contingencyPct.compareTo(BigDecimal.ZERO) > 0) {
            contingencyMultiplier = BigDecimal.ONE.add(contingencyPct.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        }

        BigDecimal baseDemand = occupancy.multiply(totalLpcd);
        BigDecimal finalDemand = baseDemand.multiply(contingencyMultiplier).setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);

        result.setCalculatedOccupancy(occupancy);
        result.setChosenLpcd(totalLpcd);
        result.setBaseDemand(baseDemand);
        result.setContingencyPercentage(contingencyPct);
        result.setTotalWaterDemand(finalDemand);
    }

    private BigDecimal getBigDecimal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val == null ? BigDecimal.ZERO : new BigDecimal(val.toString());
    }
}