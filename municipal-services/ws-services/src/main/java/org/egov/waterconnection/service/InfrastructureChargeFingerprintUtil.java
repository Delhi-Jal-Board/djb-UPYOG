package org.egov.waterconnection.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

import org.egov.waterconnection.web.models.ConstructionDetail;
import org.egov.waterconnection.web.models.Document;
import org.egov.waterconnection.web.models.Property;
import org.egov.waterconnection.web.models.Unit;
import org.egov.waterconnection.web.models.WaterConnection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Creates a stable fingerprint from property fields which can affect the IFC estimate. */
@Component
public class InfrastructureChargeFingerprintUtil {

    private static final Set<String> IFC_PROPERTY_DETAILS_KEYS = Collections.unmodifiableSet(new TreeSet<>(Arrays.asList(
            "farArea", "far_area", "farBuiltUpArea", "nonFarArea", "nonFARArea", "nonFarBuiltUpArea", "non_far_area",
            "builtUpArea", "built_up_area", "totalBuiltUpArea", "totalBuiltupArea", "carpetArea", "carpet_area",
            "coveredArea", "covered_area", "plotArea", "plot_area", "landArea", "land_area",
            "numberOfDwellingUnits", "totalDU", "total_du", "dwellingUnits", "numberOfBeds", "noOfBeds",
            "sanctionedBeds", "sanctioned_beds", "totalBeds", "total_beds", "beds", "noOfRooms", "numberOfRooms",
            "totalRooms", "total_rooms", "numberOfStudents", "noOfStudents", "totalStudents", "total_students",
            "numberOfStaff", "noOfStaff", "totalStaff", "total_staff", "noOfSeats", "numberOfSeats", "totalSeats",
            "total_seats", "servantQuarterArea", "sqArea", "sq_area", "totalStrengthIncludingStaffAndStudents",
            "total_strength_including_staff_and_students", "totalStrengthIncludingBothShifts", "totalStudentsAndStaff",
            "doubleShiftTotalStrength", "totalStrength", "waterConnectionUsageType", "demandNormCode",
            "waterDemandNormCode", "subCategoryCode", "waterDemandSubCategoryCode", "propertyCategory",
            "propertyUsageCategory", "rawUsageType", "usageCategoryDetail", "subUsageCategory")));

    private static final Set<String> NUMERIC_KEYS = Collections.unmodifiableSet(new TreeSet<>(Arrays.asList(
            "farArea", "far_area", "farBuiltUpArea", "nonFarArea", "nonFARArea", "nonFarBuiltUpArea", "non_far_area",
            "builtUpArea", "built_up_area", "totalBuiltUpArea", "totalBuiltupArea", "carpetArea", "carpet_area",
            "coveredArea", "covered_area", "plotArea", "plot_area", "landArea", "land_area", "numberOfDwellingUnits",
            "totalDU", "total_du", "dwellingUnits", "numberOfBeds", "noOfBeds", "sanctionedBeds", "sanctioned_beds",
            "totalBeds", "total_beds", "beds", "noOfRooms", "numberOfRooms", "totalRooms", "total_rooms",
            "numberOfStudents", "noOfStudents", "totalStudents", "total_students", "numberOfStaff", "noOfStaff",
            "totalStaff", "total_staff", "noOfSeats", "numberOfSeats", "totalSeats", "total_seats",
            "servantQuarterArea", "sqArea", "sq_area", "totalStrengthIncludingStaffAndStudents",
            "total_strength_including_staff_and_students", "totalStrengthIncludingBothShifts", "totalStudentsAndStaff",
            "doubleShiftTotalStrength", "totalStrength")));

    @Autowired
    private ObjectMapper mapper;

    public Snapshot create(Property property, WaterConnection connection) {
        Map<String, Object> snapshot = new TreeMap<>();
        snapshot.put("propertyId", normalizeText(property == null ? null : property.getPropertyId()));
        snapshot.put("tenantId", normalizeText(property == null ? null : property.getTenantId()));
        snapshot.put("propertyType", normalizeText(property == null ? null : property.getPropertyType()));
        snapshot.put("usageCategory", normalizeText(property == null ? null : property.getUsageCategory()));
        snapshot.put("landArea", normalizeNumber(property == null ? null : property.getLandArea()));
        snapshot.put("superBuiltUpArea", normalizeNumber(property == null ? null : property.getSuperBuiltUpArea()));
        snapshot.put("localityCode", getLocalityCode(property));
        snapshot.put("additionalDetails", extractRelevantAdditionalDetails(property));
        // Unit area is included only when the calculator must fall back to unit-level
        // areas. Changes to unrelated unit metadata do not trigger IFC reassessment.
        snapshot.put("unitAreaFallback", effectiveUnitAreaFallback(property));
        snapshot.put("active12ABCertificate", hasActive12ABCertificate(connection));

        try {
            String json = mapper.writeValueAsString(snapshot);
            return new Snapshot(sha256(json), json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Unable to serialize IFC property snapshot", e);
        }
    }

    private Map<String, Object> extractRelevantAdditionalDetails(Property property) {
        Map<String, Object> selected = new TreeMap<>();
        if (property == null || property.getAdditionalDetails() == null) {
            return selected;
        }
        Map<String, Object> all;
        try {
            all = mapper.convertValue(property.getAdditionalDetails(), new TypeReference<Map<String, Object>>() { });
        } catch (IllegalArgumentException ex) {
            return selected;
        }
        for (Map.Entry<String, Object> entry : all.entrySet()) {
            if (IFC_PROPERTY_DETAILS_KEYS.contains(entry.getKey())) {
                selected.put(entry.getKey(), NUMERIC_KEYS.contains(entry.getKey())
                        ? normalizeNumber(entry.getValue()) : normalizeValue(entry.getValue()));
            }
        }
        return selected;
    }

    private Object getLocalityCode(Property property) {
        if (property == null || property.getAddress() == null || property.getAddress().getLocality() == null) {
            return null;
        }
        return normalizeText(property.getAddress().getLocality().getCode());
    }

    /** Mirrors the fallback precedence used by PropertyContextExtractor for built_up_area. */
    private Object effectiveUnitAreaFallback(Property property) {
        if (property == null) {
            return null;
        }
        Map<String, Object> details = new java.util.HashMap<>();
        if (property.getAdditionalDetails() != null) {
            try {
                details = mapper.convertValue(property.getAdditionalDetails(), new TypeReference<Map<String, Object>>() { });
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }
        BigDecimal builtUp = firstPositive(details, "builtUpArea", "built_up_area", "totalBuiltUpArea", "totalBuiltupArea");
        if (builtUp.compareTo(BigDecimal.ZERO) <= 0
                && hasAnyKey(details, "farArea", "far_area", "farBuiltUpArea")
                && hasAnyKey(details, "nonFarArea", "nonFARArea", "nonFarBuiltUpArea", "non_far_area")) {
            builtUp = firstPositive(details, "farArea", "far_area", "farBuiltUpArea")
                    .add(firstPositive(details, "nonFarArea", "nonFARArea", "nonFarBuiltUpArea", "non_far_area"));
        }
        if (builtUp.compareTo(BigDecimal.ZERO) <= 0 && property.getSuperBuiltUpArea() != null) {
            builtUp = property.getSuperBuiltUpArea();
        }
        if (builtUp.compareTo(BigDecimal.ZERO) <= 0) {
            builtUp = firstPositive(details, "coveredArea", "covered_area");
        }
        if (builtUp.compareTo(BigDecimal.ZERO) > 0) {
            return null; // Unit areas are not used by the calculator in this case.
        }

        BigDecimal total = BigDecimal.ZERO;
        if (property.getUnits() != null) {
            for (Unit unit : property.getUnits()) {
                if (unit == null || Boolean.FALSE.equals(unit.getActive()) || unit.getConstructionDetail() == null) {
                    continue;
                }
                ConstructionDetail detail = unit.getConstructionDetail();
                BigDecimal area = detail.getBuiltUpArea();
                if (area == null || area.compareTo(BigDecimal.ZERO) <= 0) {
                    area = detail.getSuperBuiltUpArea();
                }
                if (area == null || area.compareTo(BigDecimal.ZERO) <= 0) {
                    area = detail.getCarpetArea();
                }
                if (area != null && area.compareTo(BigDecimal.ZERO) > 0) {
                    total = total.add(area);
                }
            }
        }
        return normalizeNumber(total);
    }

    private BigDecimal firstPositive(Map<String, Object> details, String... keys) {
        if (details == null) {
            return BigDecimal.ZERO;
        }
        for (String key : keys) {
            Object value = details.get(key);
            if (value == null) {
                continue;
            }
            try {
                BigDecimal amount = new BigDecimal(value.toString().trim());
                if (amount.compareTo(BigDecimal.ZERO) > 0) {
                    return amount;
                }
            } catch (NumberFormatException ignored) {
                // Not a numeric area/count; continue to the next supported alias.
            }
        }
        return BigDecimal.ZERO;
    }

    private boolean hasAnyKey(Map<String, Object> details, String... keys) {
        if (details == null) {
            return false;
        }
        for (String key : keys) {
            if (details.containsKey(key)) {
                return true;
            }
        }
        return false;
    }

    private String stableJson(Map<String, Object> value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return String.valueOf(value);
        }
    }

    private boolean hasActive12ABCertificate(WaterConnection connection) {
        if (connection == null || connection.getDocuments() == null) {
            return false;
        }
        for (Document document : connection.getDocuments()) {
            if (document != null && "SECTION_12AB_CERTIFICATE".equalsIgnoreCase(document.getDocumentType())
                    && (document.getStatus() == null || "ACTIVE".equalsIgnoreCase(document.getStatus().toString()))) {
                return true;
            }
        }
        return false;
    }

    private Object normalizeValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return normalizeNumber(value);
        }
        if (value instanceof Boolean) {
            return value;
        }
        if (value instanceof String) {
            String text = ((String) value).trim();
            if (text.isEmpty()) {
                return "";
            }
            try {
                return new BigDecimal(text).stripTrailingZeros().toPlainString();
            } catch (NumberFormatException ignored) {
                return text.toUpperCase(Locale.ROOT);
            }
        }
        return String.valueOf(value);
    }

    private Object normalizeText(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private Object normalizeNumber(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return new BigDecimal(value.toString()).stripTrailingZeros().toPlainString();
        } catch (Exception ignored) {
            return normalizeValue(value);
        }
    }

    private String sha256(String value) {
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                result.append(String.format("%02x", b));
            }
            return result.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    public static class Snapshot {
        private final String fingerprint;
        private final String json;

        public Snapshot(String fingerprint, String json) {
            this.fingerprint = fingerprint;
            this.json = json;
        }

        public String getFingerprint() { return fingerprint; }
        public String getJson() { return json; }
    }
}
