package org.egov.wscalculation.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.egov.wscalculation.constants.WSCalculationConstant;
import org.egov.wscalculation.web.models.Property;
import org.egov.wscalculation.web.models.WaterDemandResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;

@Slf4j
@Component
public class WaterDemandCalculator {

    @Autowired
    private ObjectMapper mapper;

    /**
     * Primary calculation entry point returning exact WaterDemandResult model.
     *
     * @param property   Property entity containing physical & usage attributes.
     * @param masterData MDMS payload containing WaterDemandNorms.
     * @return WaterDemandResult containing final calculated demand and metadata.
     */
    public WaterDemandResult calculateAverageWaterDemand(Property property, Map<String, Object> masterData) {

        WaterDemandResult result = new WaterDemandResult();

        if (property == null || masterData == null || masterData.isEmpty()) {
            log.warn("Water demand calculation aborted: Property or MasterData is null/empty.");
            result.setTotalWaterDemand(BigDecimal.ZERO);
            return result;
        }

        // Fetch WaterDemandNorms array from Master Data
        List<Map<String, Object>> waterDemandNorms = extractWaterDemandNorms(masterData);

        if (CollectionUtils.isEmpty(waterDemandNorms)) {
            log.warn("WaterDemandNorms MDMS configuration is missing or empty.");
            result.setTotalWaterDemand(BigDecimal.ZERO);
            return result;
        }

        // Resolve target demandNormCode (e.g., "A-1", "D-6", "E-1") dynamically
        String usageCode = resolveUsageCategoryCode(property, masterData);
        log.info("Resolved target demandNormCode / subCategoryCode: '{}'", usageCode);

        // Find matching rule from WaterDemandNorms array by subCategoryCode/Code
        Map<String, Object> matchedNorm = findMatchingNormConfig(waterDemandNorms, usageCode);

        if (matchedNorm == null) {
            log.warn("No matching WaterDemandNorms found for code: '{}'", usageCode);
            result.setTotalWaterDemand(BigDecimal.ZERO);
            return result;
        }

        Boolean isActive = matchedNorm.get("isActive") == null || Boolean.parseBoolean(matchedNorm.get("isActive").toString());
        if (!isActive) {
            log.warn("WaterDemandNorms entry for Code '{}' is marked inactive in MDMS.", usageCode);
            result.setTotalWaterDemand(BigDecimal.ZERO);
            return result;
        }

        // Extract property context variables for expression evaluation
        Map<String, BigDecimal> contextVariables = extractContextVariables(property);

        // Evaluate formula and denominator
        String formula = String.valueOf(matchedNorm.getOrDefault("minOccupancyFormula", "0"));
        BigDecimal rawOccupancy = evaluateExpression(formula, contextVariables);

        BigDecimal denominator = getBigDecimalFromMap(matchedNorm, "occupancyDenominator");
        if (denominator.compareTo(BigDecimal.ZERO) == 0) {
            denominator = BigDecimal.ONE;
        }

        BigDecimal calculatedOccupancy = rawOccupancy;
//        BigDecimal calculatedOccupancy = rawOccupancy.divide(denominator, WSCalculationConstant.DIVISION_SCALE, RoundingMode.HALF_UP);

        // Resolve LPCD rates and contingency multiplier
        BigDecimal totalLpcd = getBigDecimalFromMap(matchedNorm, "totalLpcd");
        BigDecimal potableLpcd = getBigDecimalFromMap(matchedNorm, "potableLpcd");
        String ifcBasis = String.valueOf(matchedNorm.getOrDefault("ifcCalculationBasis", "TOTAL"));

        BigDecimal contingencyPct = getBigDecimalFromMap(matchedNorm, "contingencyPercentage");
        BigDecimal contingencyMultiplier = BigDecimal.ONE;
        if (contingencyPct.compareTo(BigDecimal.ZERO) > 0) {
            contingencyMultiplier = BigDecimal.ONE.add(contingencyPct.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        }

        BigDecimal initialBaseDemand = calculatedOccupancy.multiply(totalLpcd);
        BigDecimal initialTotalDemand = initialBaseDemand.multiply(contingencyMultiplier);

        BigDecimal chosenLpcd = totalLpcd;

        if ("POTABLE_ONLY_IF_OVER_12500".equalsIgnoreCase(ifcBasis)) {
            BigDecimal waterDemandThreshold = new BigDecimal("12500");
            
            // Compare calculated initial water demand (LPD) against 12,500 LPD threshold
            if (initialTotalDemand.compareTo(waterDemandThreshold) > 0) {
                chosenLpcd = potableLpcd;
                log.info("Total water demand ({} LPD) exceeds 12,500 LPD threshold. Applied Potable LPCD Rate: {}", 
                        initialTotalDemand, chosenLpcd);
            }
        }

        BigDecimal baseDemand = calculatedOccupancy.multiply(chosenLpcd);
        BigDecimal finalDemand = baseDemand.multiply(contingencyMultiplier).setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);
        String normName = (String) matchedNorm.get("name");
        // Populate WaterDemandResult fields directly matching your model
        result.setCalculatedOccupancy(calculatedOccupancy);
        result.setChosenLpcd(chosenLpcd);
        result.setBaseDemand(baseDemand);
        result.setContingencyPercentage(contingencyPct);
        result.setTotalWaterDemand(finalDemand);
        result.setMatchedNormCode(usageCode);
        result.setFormulaUsed(formula);
        result.setCalculationBasisApplied(ifcBasis);
        result.setContextVariables(contextVariables);
        result.setMatchedNormName(normName);

        // Generate execution audit trace
        printCalculationReport(property, matchedNorm, usageCode, formula, contextVariables, calculatedOccupancy, chosenLpcd, contingencyPct, finalDemand);

        return result;
    }

    /**
     * Resolves the target subCategoryCode / demandNormCode ("A-1", "D-6", "E-1")
     * dynamically using Property details cross-referenced with MDMS master data.
     */
    public String resolveUsageCategoryCode(Property property, Map<String, Object> masterData) {
        if (property == null) {
            return "UNKNOWN";
        }

        Map<String, Object> details = getPropertyAdditionalDetailsMap(property);

        // Extract raw usage keys from Property & Additional Details
        String rawUsageCode = "";
        if (details.get("waterConnectionUsageType") != null && StringUtils.isNotBlank(details.get("waterConnectionUsageType").toString())) {
            rawUsageCode = details.get("waterConnectionUsageType").toString().trim();
        } else if (details.get("subCategoryCode") != null && StringUtils.isNotBlank(details.get("subCategoryCode").toString())) {
            rawUsageCode = details.get("subCategoryCode").toString().trim();
        } else if (details.get("subUsageCategory") != null && StringUtils.isNotBlank(details.get("subUsageCategory").toString())) {
            rawUsageCode = details.get("subUsageCategory").toString().trim();
        } else if (details.get("usageCategoryDetail") != null && StringUtils.isNotBlank(details.get("usageCategoryDetail").toString())) {
            rawUsageCode = details.get("usageCategoryDetail").toString().trim();
        } else if (StringUtils.isNotBlank(property.getUsageCategory())) {
            rawUsageCode = property.getUsageCategory().trim();
        } else if (StringUtils.isNotBlank(property.getPropertyType())) {
            rawUsageCode = property.getPropertyType().trim();
        }

        if (StringUtils.isBlank(rawUsageCode)) {
            return "UNKNOWN";
        }

        // Direct demand norm code check (e.g., A-1, D-6, E-1)
        if (rawUsageCode.matches("^[A-Z](-[0-9a-zA-Z_]+)?$")) {
            return rawUsageCode;
        }

        // 1. Lookup demandNormCode from PropertyNewUsageType MDMS
        String mappedNormCode = lookupDemandNormCodeFromMdms(masterData, rawUsageCode, WSCalculationConstant.WC_PROPERTY_NEW_USAGE_TYPE_MASTER);
        if (StringUtils.isNotBlank(mappedNormCode)) {
            return mappedNormCode;
        }

        // 2. Lookup demandNormCode from PropertyType MDMS
        mappedNormCode = lookupDemandNormCodeFromMdms(masterData, rawUsageCode, WSCalculationConstant.WC_PROPERTY_TYPE_MASTER);
        if (StringUtils.isNotBlank(mappedNormCode)) {
            return mappedNormCode;
        }

        return rawUsageCode;
    }

    /**
     * Searches MDMS master data to resolve 'demandNormCode' dynamically.
     */
    @SuppressWarnings("unchecked")
    private String lookupDemandNormCodeFromMdms(Map<String, Object> masterData, String rawCode, String masterKey) {
        if (masterData == null || StringUtils.isBlank(rawCode)) {
            return null;
        }

        Object masterObj = masterData.get(masterKey);
        if (masterObj == null && WSCalculationConstant.WC_PROPERTY_NEW_USAGE_TYPE_MASTER.equalsIgnoreCase(masterKey)) {
            masterObj = masterData.get("PropertyNewUsageType");
        }

        if (masterObj == null) {
            return null;
        }

        List<Map<String, Object>> masterList = new ArrayList<>();
        if (masterObj instanceof JSONArray) {
            masterList = mapper.convertValue(masterObj, new TypeReference<List<Map<String, Object>>>() {});
        } else if (masterObj instanceof List) {
            masterList = (List<Map<String, Object>>) masterObj;
        }

        if (CollectionUtils.isEmpty(masterList)) {
            return null;
        }

        // Pass 1: Try matching 'code' directly
        for (Map<String, Object> entry : masterList) {
            String code = String.valueOf(entry.getOrDefault("code", "")).trim();
            Boolean active = entry.get("active") == null || Boolean.parseBoolean(entry.get("active").toString());

            if (active && code.equalsIgnoreCase(rawCode)) {
                Object normCode = entry.get("demandNormCode");
                if (normCode != null && StringUtils.isNotBlank(normCode.toString())) {
                    log.info("Successfully mapped code '{}' -> demandNormCode '{}' using MDMS master '{}'", rawCode, normCode, masterKey);
                    return normCode.toString().trim();
                }
            }
        }

        // Pass 2: Fallback to matching 'type' (e.g. COMMERCIAL, INSTITUTIONAL, ASSEMBLY)
        for (Map<String, Object> entry : masterList) {
            String type = String.valueOf(entry.getOrDefault("type", "")).trim();
            Boolean active = entry.get("active") == null || Boolean.parseBoolean(entry.get("active").toString());

            if (active && type.equalsIgnoreCase(rawCode)) {
                Object normCode = entry.get("demandNormCode");
                if (normCode != null && StringUtils.isNotBlank(normCode.toString())) {
                    log.info("Successfully mapped type '{}' -> demandNormCode '{}' using MDMS master '{}'", rawCode, normCode, masterKey);
                    return normCode.toString().trim();
                }
            }
        }

        return null;
    }

    
    private Map<String, BigDecimal> extractContextVariables(Property property) {
        Map<String, BigDecimal> vars = new HashMap<>();
        Map<String, Object> details = getPropertyAdditionalDetailsMap(property);

        // 1. Extract FAR Area explicitly (Checking farArea / far_area)
        BigDecimal farArea = getBigDecimalFromMap(details, "farArea");
        if (farArea.compareTo(BigDecimal.ZERO) == 0) {
            farArea = getBigDecimalFromMap(details, "far_area");
        }

        // 2. Extract Built-up Area with fallbacks
        BigDecimal builtUpArea = getBigDecimalFromMap(details, "builtUpArea");
        if (builtUpArea.compareTo(BigDecimal.ZERO) == 0 && details.get("coveredArea") != null) {
            builtUpArea = parseBigDecimal(details.get("coveredArea"));
        }
        if (builtUpArea.compareTo(BigDecimal.ZERO) == 0 && property.getSuperBuiltUpArea() != null) {
            builtUpArea = BigDecimal.valueOf(property.getSuperBuiltUpArea().doubleValue());
        }

        // Fallback: If FAR Area is not explicitly passed, fallback to builtUpArea
        if (farArea.compareTo(BigDecimal.ZERO) == 0) {
            farArea = builtUpArea;
        }

        // 3. Extract Plot Area
        BigDecimal plotArea = property.getLandArea() != null 
                ? BigDecimal.valueOf(property.getLandArea()) 
                : getBigDecimalFromMap(details, "plotArea");

        // 4. Extract Dwelling Units
        BigDecimal duCount = getBigDecimalFromMap(details, WSCalculationConstant.NUMBER_OF_DWELLING_UNITS);
        if (duCount.compareTo(BigDecimal.ZERO) == 0) {
            duCount = getBigDecimalFromMap(details, "numberOfDwellingUnits");
        }

        // 5. Extract Special Occupancy Counters (with dual camelCase/snake_case checks)
        BigDecimal bedsCount = getBigDecimalFromMap(details, "noOfBeds");
        if (bedsCount.compareTo(BigDecimal.ZERO) == 0) {
            bedsCount = getBigDecimalFromMap(details, "numberOfBeds");
        }

        BigDecimal roomsCount = getBigDecimalFromMap(details, "noOfRooms");
        if (roomsCount.compareTo(BigDecimal.ZERO) == 0) {
            roomsCount = getBigDecimalFromMap(details, "numberOfRooms");
        }

        // FIX: JSON payload contains "numberOfStudents"
        BigDecimal studentsCount = getBigDecimalFromMap(details, "numberOfStudents");
        if (studentsCount.compareTo(BigDecimal.ZERO) == 0) {
            studentsCount = getBigDecimalFromMap(details, "noOfStudents");
        }

        BigDecimal seatsCount = getBigDecimalFromMap(details, "noOfSeats");
        if (seatsCount.compareTo(BigDecimal.ZERO) == 0) {
            seatsCount = getBigDecimalFromMap(details, "numberOfSeats");
        }

        BigDecimal staffCount = getBigDecimalFromMap(details, "noOfStaff");
        if (staffCount.compareTo(BigDecimal.ZERO) == 0) {
            staffCount = getBigDecimalFromMap(details, "numberOfStaff");
        }

        // 6. Map to Formula Variables
        vars.put("far_area", farArea);
        vars.put("built_up_area", builtUpArea);
        vars.put("covered_area", builtUpArea);
        vars.put("plot_area", plotArea);
        vars.put("total_du", duCount);
        vars.put("dwelling_units", duCount);
        vars.put("sanctioned_beds", bedsCount);
        vars.put("total_beds", bedsCount);
        vars.put("total_rooms", roomsCount);
        vars.put("highest_shift_strength", studentsCount);
        vars.put("total_students", studentsCount);
        vars.put("total_seats", seatsCount);
        vars.put("total_staff", staffCount);

        return vars;
    }
    
    public BigDecimal evaluateExpression(String expression, Map<String, BigDecimal> context) {
        if (StringUtils.isBlank(expression)) {
            return BigDecimal.ZERO;
        }

        String expr = expression.trim();

        if (expr.startsWith("(") && expr.endsWith(")") && isMatchingParenthesis(expr)) {
            return evaluateExpression(expr.substring(1, expr.length() - 1), context);
        }

        if (expr.toUpperCase(Locale.ROOT).startsWith("MAX(") && expr.endsWith(")")) {
            String inner = expr.substring(4, expr.length() - 1);
            List<String> args = splitArguments(inner);
            BigDecimal maxVal = null;
            for (String arg : args) {
                BigDecimal val = evaluateExpression(arg, context);
                if (maxVal == null || val.compareTo(maxVal) > 0) {
                    maxVal = val;
                }
            }
            return maxVal != null ? maxVal : BigDecimal.ZERO;
        }

        if (expr.toUpperCase(Locale.ROOT).startsWith("MIN(") && expr.endsWith(")")) {
            String inner = expr.substring(4, expr.length() - 1);
            List<String> args = splitArguments(inner);
            BigDecimal minVal = null;
            for (String arg : args) {
                BigDecimal val = evaluateExpression(arg, context);
                if (minVal == null || val.compareTo(minVal) < 0) {
                    minVal = val;
                }
            }
            return minVal != null ? minVal : BigDecimal.ZERO;
        }

        if (expr.toUpperCase(Locale.ROOT).startsWith("IF(") && expr.endsWith(")")) {
            String inner = expr.substring(3, expr.length() - 1);
            List<String> args = splitArguments(inner);
            if (args.size() == 3) {
                boolean conditionResult = evaluateCondition(args.get(0), context);
                return conditionResult ? evaluateExpression(args.get(1), context) : evaluateExpression(args.get(2), context);
            }
        }

        int addSubIdx = findTopLevelOperator(expr, Arrays.asList("+", "-"));
        if (addSubIdx > 0) {
            String op = String.valueOf(expr.charAt(addSubIdx));
            BigDecimal left = evaluateExpression(expr.substring(0, addSubIdx), context);
            BigDecimal right = evaluateExpression(expr.substring(addSubIdx + 1), context);
            return "+".equals(op) ? left.add(right) : left.subtract(right);
        }

        int mulDivIdx = findTopLevelOperator(expr, Arrays.asList("*", "/"));
        if (mulDivIdx > 0) {
            String op = String.valueOf(expr.charAt(mulDivIdx));
            BigDecimal left = evaluateExpression(expr.substring(0, mulDivIdx), context);
            BigDecimal right = evaluateExpression(expr.substring(mulDivIdx + 1), context);
            if ("/".equals(op)) {
                if (right.compareTo(BigDecimal.ZERO) == 0) {
                    log.warn("Division by zero in expression: {}. Returning ZERO.", expr);
                    return BigDecimal.ZERO;
                }
                return left.divide(right, WSCalculationConstant.DIVISION_SCALE, RoundingMode.HALF_UP);
            } else {
                return left.multiply(right);
            }
        }

        return resolveToken(expr, context);
    }

    private boolean evaluateCondition(String condition, Map<String, BigDecimal> context) {
        if (condition.contains(">=")) {
            String[] parts = condition.split(">=");
            return evaluateExpression(parts[0], context).compareTo(evaluateExpression(parts[1], context)) >= 0;
        } else if (condition.contains("<=")) {
            String[] parts = condition.split("<=");
            return evaluateExpression(parts[0], context).compareTo(evaluateExpression(parts[1], context)) <= 0;
        } else if (condition.contains(">")) {
            String[] parts = condition.split(">");
            return evaluateExpression(parts[0], context).compareTo(evaluateExpression(parts[1], context)) > 0;
        } else if (condition.contains("<")) {
            String[] parts = condition.split("<");
            return evaluateExpression(parts[0], context).compareTo(evaluateExpression(parts[1], context)) < 0;
        } else if (condition.contains("==")) {
            String[] parts = condition.split("==");
            return evaluateExpression(parts[0], context).compareTo(evaluateExpression(parts[1], context)) == 0;
        }
        return false;
    }

    private int findTopLevelOperator(String expr, List<String> operators) {
        int depth = 0;
        for (int i = expr.length() - 1; i >= 0; i--) {
            char c = expr.charAt(i);
            if (c == ')') depth++;
            else if (c == '(') depth--;
            else if (depth == 0) {
                String s = String.valueOf(c);
                if (operators.contains(s) && i > 0 && i < expr.length() - 1) {
                    return i;
                }
            }
        }
        return -1;
    }

    private List<String> splitArguments(String innerText) {
        List<String> args = new ArrayList<>();
        int depth = 0;
        StringBuilder current = new StringBuilder();

        for (int i = 0; i < innerText.length(); i++) {
            char c = innerText.charAt(i);
            if (c == '(') depth++;
            else if (c == ')') depth--;

            if (c == ',' && depth == 0) {
                args.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        if (current.length() > 0) {
            args.add(current.toString().trim());
        }
        return args;
    }

    private boolean isMatchingParenthesis(String expr) {
        int depth = 0;
        for (int i = 0; i < expr.length(); i++) {
            char c = expr.charAt(i);
            if (c == '(') depth++;
            else if (c == ')') depth--;
            if (depth == 0 && i < expr.length() - 1) {
                return false;
            }
        }
        return depth == 0;
    }

    private BigDecimal resolveToken(String token, Map<String, BigDecimal> context) {
        String key = token.trim().toLowerCase(Locale.ROOT);
        if (context.containsKey(key)) {
            return context.get(key);
        }
        try {
            return new BigDecimal(token.trim());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractWaterDemandNorms(Map<String, Object> masterData) {
        Object normsObj = masterData.get("WaterDemandNorms");
        if (normsObj == null) {
            normsObj = masterData.get("WATER_DEMAND_NORMS");
        }
        if (normsObj == null) {
            normsObj = masterData.get(WSCalculationConstant.WATER_DEMAND_NORMS);
        }

        if (normsObj instanceof JSONArray) {
            return mapper.convertValue(normsObj, new TypeReference<List<Map<String, Object>>>() {});
        } else if (normsObj instanceof List) {
            return (List<Map<String, Object>>) normsObj;
        }

        return new ArrayList<>();
    }

    private Map<String, Object> findMatchingNormConfig(List<Map<String, Object>> norms, String code) {
        if (StringUtils.isBlank(code)) {
            return null;
        }

        String searchCode = code.toUpperCase(Locale.ROOT);

        for (Map<String, Object> norm : norms) {
            String subCategoryCode = String.valueOf(norm.getOrDefault("subCategoryCode", "")).toUpperCase(Locale.ROOT);
            String normCode = String.valueOf(norm.getOrDefault("code", "")).toUpperCase(Locale.ROOT);

            if (searchCode.equals(subCategoryCode) || searchCode.equals(normCode)) {
                return norm;
            }
        }

        for (Map<String, Object> norm : norms) {
            String parentUsageCode = String.valueOf(norm.getOrDefault("parentUsageCode", "")).toUpperCase(Locale.ROOT);
            if (searchCode.equals(parentUsageCode)) {
                return norm;
            }
        }

        for (Map<String, Object> norm : norms) {
            String subCategoryCode = String.valueOf(norm.getOrDefault("subCategoryCode", "")).toUpperCase(Locale.ROOT);
            if (StringUtils.isNotBlank(subCategoryCode) && (searchCode.startsWith(subCategoryCode) || subCategoryCode.startsWith(searchCode))) {
                return norm;
            }
        }

        return null;
    }

    private Map<String, Object> getPropertyAdditionalDetailsMap(Property property) {
        if (property == null || property.getAdditionalDetails() == null) {
            return new HashMap<>();
        }
        return mapper.convertValue(property.getAdditionalDetails(), new TypeReference<Map<String, Object>>() {});
    }

    private BigDecimal getBigDecimalFromMap(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key) || map.get(key) == null) {
            return BigDecimal.ZERO;
        }
        return parseBigDecimal(map.get(key));
    }

    private BigDecimal parseBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        try {
            return new BigDecimal(val.toString().trim());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private void printCalculationReport(Property property, Map<String, Object> norm, String usageCode,
                                        String formula, Map<String, BigDecimal> contextVars, BigDecimal occupancy,
                                        BigDecimal lpcd, BigDecimal contingencyPct, BigDecimal totalDemand) {
        try {
            log.info("======================================================================");
            log.info("               WATER DEMAND CALCULATION REPORT                        ");
            log.info("======================================================================");
            log.info("Property ID          : {}", property.getPropertyId() != null ? property.getPropertyId() : "N/A");
            log.info("Resolved Usage Code  : {}", usageCode);
            log.info("Norm Category        : {}", norm.getOrDefault("name", "N/A"));
            log.info("Applied Formula      : {}", formula);

            contextVars.forEach((k, v) -> {
                if (v != null && v.compareTo(BigDecimal.ZERO) > 0) {
                    log.info("Input Parameter [{}] : {}", k, v);
                }
            });

            log.info("Calculated Occupancy : {} Persons/Units", occupancy);
            log.info("Applied LPCD Rate    : {} Liters", lpcd);
            if (contingencyPct.compareTo(BigDecimal.ZERO) > 0) {
                log.info("Contingency Factor   : {}%", contingencyPct);
            }
            log.info("----------------------------------------------------------------------");
            log.info("TOTAL CALCULATED DEMAND : {} LPD", totalDemand);
            log.info("======================================================================");
        } catch (Exception e) {
            log.error("Error generating calculation trace report", e);
        }
    }

    public Map<String, Object> traceWaterDemandLogDetails(Property property, Map<String, Object> masterData) {
        Map<String, Object> trace = new LinkedHashMap<>();
        try {
            if (property == null || masterData == null || masterData.isEmpty()) {
                trace.put("status", "SKIPPED");
                trace.put("reason", "Property or MasterData is null/empty");
                return trace;
            }

            List<Map<String, Object>> norms = extractWaterDemandNorms(masterData);
            String usageCode = resolveUsageCategoryCode(property, masterData);
            Map<String, Object> norm = findMatchingNormConfig(norms, usageCode);

            trace.put("resolvedDemandNormCode", usageCode);

            if (norm != null) {
                Map<String, BigDecimal> vars = extractContextVariables(property);
                String formula = String.valueOf(norm.getOrDefault("minOccupancyFormula", "0"));

                // Evaluate formula directly for calculated occupancy
                BigDecimal calculatedOccupancy = evaluateExpression(formula, vars);

                BigDecimal totalLpcd = getBigDecimalFromMap(norm, "totalLpcd");
                BigDecimal potableLpcd = getBigDecimalFromMap(norm, "potableLpcd");
                String ifcBasis = String.valueOf(norm.getOrDefault("ifcCalculationBasis", "TOTAL"));

                BigDecimal contingencyPct = getBigDecimalFromMap(norm, "contingencyPercentage");
                BigDecimal contingencyMultiplier = BigDecimal.ONE;
                if (contingencyPct.compareTo(BigDecimal.ZERO) > 0) {
                    contingencyMultiplier = BigDecimal.ONE.add(contingencyPct.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
                }

                // Evaluate initial demand & threshold for LPCD selection
                BigDecimal initialBaseDemand = calculatedOccupancy.multiply(totalLpcd);
                BigDecimal initialTotalDemand = initialBaseDemand.multiply(contingencyMultiplier);

                BigDecimal chosenLpcd = totalLpcd;
                boolean thresholdTriggered = false;

                if ("POTABLE_ONLY_IF_OVER_12500".equalsIgnoreCase(ifcBasis)) {
                    BigDecimal waterDemandThreshold = new BigDecimal("12500");
                    if (initialTotalDemand.compareTo(waterDemandThreshold) > 0) {
                        chosenLpcd = potableLpcd;
                        thresholdTriggered = true;
                    }
                }

                BigDecimal baseDemand = calculatedOccupancy.multiply(chosenLpcd);
                BigDecimal finalDemand = baseDemand.multiply(contingencyMultiplier).setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);

                // Populate trace map
                trace.put("subCategoryCode", norm.getOrDefault("subCategoryCode", usageCode));
                trace.put("parentUsageCode", norm.get("parentUsageCode"));
                trace.put("categoryName", norm.get("name"));
                trace.put("formula", formula);
                trace.put("contextVariables", vars);
                trace.put("calculatedOccupancy", calculatedOccupancy);
                trace.put("totalLpcd", totalLpcd);
                trace.put("potableLpcd", potableLpcd);
                trace.put("chosenLpcd", chosenLpcd);
                trace.put("threshold12500Triggered", thresholdTriggered);
                trace.put("contingencyPercentage", contingencyPct);
                trace.put("ifcCalculationBasis", ifcBasis);
                trace.put("baseDemand", baseDemand);
                trace.put("totalWaterDemand", finalDemand);
            } else {
                trace.put("warning", "No matching WaterDemandNorms configuration found in MDMS for code: " + usageCode);
            }
        } catch (Exception e) {
            log.error("Error generating water demand log trace", e);
            trace.put("error", e.getMessage());
        }
        return trace;
    }
}