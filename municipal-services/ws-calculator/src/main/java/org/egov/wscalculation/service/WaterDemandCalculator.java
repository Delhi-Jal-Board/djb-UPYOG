package org.egov.wscalculation.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.egov.wscalculation.constants.WSCalculationConstant;
import org.egov.wscalculation.web.models.Property;
import org.egov.wscalculation.web.models.enums.BuildingType;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;

@Component
@Slf4j
public class WaterDemandCalculator {

	private final ObjectMapper mapper = new ObjectMapper();

	private BuildingType resolveFromUsageTypeMdms(Map<String, Object> masterData, String usageType) {

		if (masterData == null || StringUtils.isBlank(usageType)) {
			return BuildingType.UNKNOWN;
		}

		JSONArray usageTypes = (JSONArray) masterData.get(WSCalculationConstant.WC_PROPERTY_NEW_USAGE_TYPE_MASTER);

		if (CollectionUtils.isEmpty((Collection<?>) usageTypes)) {
			log.warn("PropertyNewUsageType MDMS not found.");
			return BuildingType.UNKNOWN;
		}

		for (Object obj : usageTypes) {

			JSONObject usage = mapper.convertValue(obj, JSONObject.class);
			String code = usage.toJSONString().trim().toUpperCase();
			
			if (!code.equalsIgnoreCase(usageType)) {
				continue;
			}

			log.info("PropertyNewUsageType matched from MDMS : {}", code);
			return mapUsageTypeToBuildingType(code);
		}

		log.info("No PropertyNewUsageType match found in MDMS for {}", usageType);
		return BuildingType.UNKNOWN;
	}

	private BuildingType resolveFromPropertyTypeMdms(Map<String, Object> masterData, String propertyType) {

		if (masterData == null || StringUtils.isBlank(propertyType)) {
			return BuildingType.UNKNOWN;
		}

		JSONArray propertyTypes = (JSONArray) masterData.get(WSCalculationConstant.WC_PROPERTY_TYPE_MASTER);

		if (CollectionUtils.isEmpty((Collection<?>) propertyTypes)) {
			log.warn("PropertyType MDMS not found.");
			return BuildingType.UNKNOWN;
		}

		for (Object obj : propertyTypes) {

			Map<String, Object> type = mapper.convertValue(obj, new TypeReference<Map<String, Object>>() {
			});

			String code = String.valueOf(type.get("code")).trim().toUpperCase();

			if (!code.equalsIgnoreCase(propertyType)) {
				continue;
			}

			log.info("PropertyType matched from MDMS : {}", code);

			return mapPropertyTypeToBuildingType(code);
		}

		log.info("No PropertyType match found in MDMS for {}", propertyType);

		return BuildingType.UNKNOWN;
	}

	/**
	 * Maps PropertyNewUsageType MDMS code to internal BuildingType.
	 */
	private BuildingType mapUsageTypeToBuildingType(String code) {

		if (StringUtils.isBlank(code)) {
			return BuildingType.UNKNOWN;
		}

		switch (code.trim().toUpperCase()) {

		/* ---------------- Residential ---------------- */
		case "EWS":
		case "EWS_FLAT":
			return BuildingType.EWS_FLAT;

		case "JANTA_FLATS":
			return BuildingType.JANTA_FLAT;

		case "LIG":
		case "LIG_FLATS":
			return BuildingType.LIG_FLAT;

		case "MIG":
		case "MIG_FLATS":
			return BuildingType.MIG_FLAT;

		case "HIG":
		case "HIG_FLATS":
			return BuildingType.HIG_FLAT;

		case "COOP_GROUP_HOUSING":
		case "GROUP_HOUSING":
			return BuildingType.GROUP_HOUSING;

		case "DHARAMSHALAS_HOSTELS":
			return BuildingType.HOSTEL;

		case "RESIDENTIAL":
			return BuildingType.INDIVIDUAL_HOUSE;

		/* ---------------- Institutional ---------------- */

		case "PVT_HOSPITALS":
		case "GOVT_HOSPITALS":
			return BuildingType.HOSPITAL;

		case "PVT_SCHOOLS":
		case "GOVT_SCHOOLS_GNCTD":
		case "GOVT_SCHOOLS_GOI":
		case "NDMC_SCHOOLS":
		case "SDMC_SCHOOLS":
		case "EDMC_SCHOOLS":
		case "BLIND_SCHOOLS":
			return BuildingType.SCHOOL;

		case "PVT_INSTITUTE":
		case "GOVT_INSTITUTE":
			return BuildingType.COLLEGE;

		/* ---------------- Commercial ---------------- */

		case "PROFESSIONAL_OFFICE":
		case "GOVT_OFFICES_PSU_BANK":
			return BuildingType.OFFICE;

		case "SHOPS":
		case "DDA_SHOP":
		case "COMBINED_SHOPS_MILK_FRUIT_VEG":
			return BuildingType.SHOP;

		case "MALLS":
			return BuildingType.SHOPPING_MALL;

		case "RESTAURANT":
		case "DHABA":
		case "HOTEL_GUEST_HOUSES":
			return BuildingType.HOTEL;

		case "CINEPLEX":
			return BuildingType.CINEMA;

		/* ---------------- Industrial ---------------- */

		case "FACTORY":
		case "WAREHOUSE":
		case "COLD_STORAGE":
		case "BOTTLING_PLANT":
		case "ICE_FACTORY":
		case "SOFT_DRINK_FACTORY":
		case "SODA_FACTORY":
		case "COLOUR_DYE_SHOP_FACTORY":
		case "MOULDING_FACTORY":
		case "JEWELLERY_FACTORY":
		case "COOLING_PLANT":
			return BuildingType.INDUSTRIAL;

		default:
			return BuildingType.UNKNOWN;
		}
	}

	/**
	 * Maps PropertyType MDMS code to internal BuildingType.
	 */
	private BuildingType mapPropertyTypeToBuildingType(String code) {

		if (StringUtils.isBlank(code)) {
			return BuildingType.UNKNOWN;
		}

		switch (code.trim().toUpperCase()) {

		/* ---------------- Residential ---------------- */

		case "INDIVIDUALHOUSE":
			return BuildingType.INDIVIDUAL_HOUSE;

		case "GROUPHOUSINGSOCIETY":
			return BuildingType.GROUP_HOUSING;

		case "DHARAMSHALASORHOSTELS":
			return BuildingType.HOSTEL;

		case "DDAFLATS":
		case "GOVTFLATS":
			return BuildingType.APARTMENT;

		case "BUNGALOWS":
			return BuildingType.INDIVIDUAL_HOUSE;

		/* ---------------- Institutional ---------------- */

		case "SCHOOL":
			return BuildingType.SCHOOL;

		case "COLLEGE":
			return BuildingType.COLLEGE;

		case "HOSPITALNURSINGHOME":
			return BuildingType.HOSPITAL;

		case "GOVERNMENTBUILDINGS":
			return BuildingType.OFFICE;

		/* ---------------- Commercial ---------------- */

		case "OFFICE":
			return BuildingType.OFFICE;

		case "SHOP":
			return BuildingType.SHOP;

		case "MALL":
			return BuildingType.SHOPPING_MALL;

		case "HOTELORRESTAURANT":
			return BuildingType.HOTEL;

		case "BANQUETHALL":
			return BuildingType.BUSINESS_BUILDING;

		case "DDACOMMERCIALCOMPLEX":
			return BuildingType.BUSINESS_BUILDING;

		case "PUBLICTOILET":
			return BuildingType.BUSINESS_BUILDING;

		case "MOTHERDAIRYBOOTH":
			return BuildingType.SHOP;

		/* ---------------- Industrial ---------------- */

		case "FACTORY":
			return BuildingType.INDUSTRIAL;

		case "WAREHOUSE":
			return BuildingType.STORAGE;

		default:
			return BuildingType.UNKNOWN;
		}
	}

	/**
	 * Resolves DJB Building Type from Property details.
	 */
	public BuildingType resolveBuildingType(Property property, Map<String, Object> masterData) {

		if (property == null) {
			log.warn("Property is null. Returning UNKNOWN.");
			return BuildingType.UNKNOWN;
		}

		Map<String, Object> details = property.getAdditionalDetails() == null ? new HashMap<>()
				: mapper.convertValue(property.getAdditionalDetails(), new TypeReference<Map<String, Object>>() {
				});

		String propertyType = property.getPropertyType() == null ? "" : property.getPropertyType().trim().toUpperCase();
		String usageCategory = property.getUsageCategory() == null ? "" : property.getUsageCategory().trim().toUpperCase();
		String waterUsageType = "";

		if (details.get("waterConnectionUsageType") != null) {
			waterUsageType = details.get("waterConnectionUsageType").toString().trim().toUpperCase();
		}

		log.info("Resolving BuildingType : PropertyType={}, UsageCategory={}, WaterConnectionUsageType={}", propertyType, usageCategory, waterUsageType);
		
		BuildingType buildingType = resolveFromUsageTypeMdms(masterData, waterUsageType);

		if (buildingType != BuildingType.UNKNOWN) {
			return buildingType;
		}

		buildingType = resolveFromPropertyTypeMdms(masterData, propertyType);

		if (buildingType != BuildingType.UNKNOWN) {
			return buildingType;
		}

		switch (waterUsageType) {

		case "EWS":
		case "EWS_FLAT":
			return BuildingType.EWS_FLAT;

		case "JANTA_FLATS":
			return BuildingType.JANTA_FLAT;

		case "LIG":
		case "LIG_FLATS":
			return BuildingType.LIG_FLAT;

		case "MIG":
		case "MIG_FLATS":
			return BuildingType.MIG_FLAT;

		case "HIG":
		case "HIG_FLATS":
			return BuildingType.HIG_FLAT;

		case "GROUP_HOUSING":
			return BuildingType.GROUP_HOUSING;
		}

		switch (propertyType) {

		case "INDIVIDUALHOUSE":
			return BuildingType.INDIVIDUAL_HOUSE;

		case "GROUPHOUSINGSOCIETY":
			return BuildingType.GROUP_HOUSING;

		case "DHARAMSHALASORHOSTELS":
			return BuildingType.HOSTEL;

		case "HOSPITALNURSINGHOME":
			return BuildingType.HOSPITAL;

		case "SCHOOL":
			return BuildingType.SCHOOL;

		case "COLLEGE":
			return BuildingType.COLLEGE;

		case "HOTELORRESTAURANT":
			return BuildingType.HOTEL;

		case "WAREHOUSE":
			return BuildingType.INDUSTRIAL;

		case "FACTORY":
			return BuildingType.INDUSTRIAL;
		}

		switch (usageCategory) {

		case "RESIDENTIAL":
			return BuildingType.INDIVIDUAL_HOUSE;

		case "COMMERCIAL":
			return BuildingType.BUSINESS_BUILDING;

		case "INDUSTRIAL":
			return BuildingType.INDUSTRIAL;

		case "INSTITUTIONAL":

			if ("HOSPITALNURSINGHOME".equals(propertyType)) {
				return BuildingType.HOSPITAL;
			}

			if ("SCHOOL".equals(propertyType)) {
				return BuildingType.SCHOOL;
			}

			if ("COLLEGE".equals(propertyType)) {
				return BuildingType.COLLEGE;
			}

			return BuildingType.UNKNOWN;

		default:
			log.warn("Unable to resolve BuildingType.");
			return BuildingType.UNKNOWN;
		}
	}

	private BigDecimal calculateIndividualHouseDemand(Property property) {

		if (property == null) {
			log.warn("Cannot calculate residential demand. Property is null.");
			return BigDecimal.ZERO;
		}

		Map<String, Object> additionalDetails = (Map<String, Object>) property.getAdditionalDetails();

		if (additionalDetails == null || additionalDetails.isEmpty()) {
			log.warn("AdditionalDetails not available.");
			return BigDecimal.ZERO;
		}

		Object builtUpAreaObject = additionalDetails.get(WSCalculationConstant.BUILT_UP_AREA);

		if (builtUpAreaObject == null) {
			log.warn("Built Up Area not found in Property Additional Details.");
			return BigDecimal.ZERO;
		}

		BigDecimal coveredArea;

		try {
			coveredArea = new BigDecimal(builtUpAreaObject.toString());
		} catch (NumberFormatException ex) {
			log.error("Invalid Built Up Area : {}", builtUpAreaObject);
			return BigDecimal.ZERO;
		}

		if (coveredArea.compareTo(BigDecimal.ZERO) <= 0) {
			log.warn("Covered Area must be greater than zero.");
			return BigDecimal.ZERO;
		}

		BigDecimal occupancy = coveredArea.divide(WSCalculationConstant.RESIDENTIAL_AREA_PER_PERSON,WSCalculationConstant.DIVISION_SCALE, RoundingMode.HALF_UP);
		BigDecimal waterDemand = occupancy.multiply(WSCalculationConstant.RESIDENTIAL_LPCD);

		log.info("Residential Water Demand Calculated :: CoveredArea={} sqm, Occupancy={}, LPCD={}, Demand={} LPD",coveredArea, occupancy, WSCalculationConstant.RESIDENTIAL_LPCD, waterDemand);

		return waterDemand.setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);
	}

	private BigDecimal getDwellingUnits(Property property) {
		return getNumericAdditionalDetail(property, WSCalculationConstant.NUMBER_OF_DWELLING_UNITS);
	}

	private BigDecimal calculateApartmentDemand(Property property, Map<String, Object> masterData) {

		if (property == null) {
			log.warn("Property is null.");
			return BigDecimal.ZERO;
		}

		BuildingType buildingType = resolveBuildingType(property, masterData);

		switch (buildingType) {

		case EWS_FLAT:
			return calculateEWSFlatDemand(property);

		case JANTA_FLAT:
			return calculateJantaFlatDemand(property);

		case LIG_FLAT:
			return calculateLIGFlatDemand(property);

		case MIG_FLAT:
			return calculateMIGFlatDemand(property);

		case HIG_FLAT:
			return calculateHIGFlatDemand(property);

		case GROUP_HOUSING:
			return calculateGroupHousingDemand(property);

		case APARTMENT:
			return calculateGroupHousingDemand(property);

		default:
			log.warn("Unsupported Apartment Type : {}", buildingType);
			return BigDecimal.ZERO;
		}
	}

	private BigDecimal calculateApartmentDemand(BigDecimal dwellingUnits, BigDecimal personsPerDU, BigDecimal lpcd,String apartmentType) {

		if (dwellingUnits.compareTo(BigDecimal.ZERO) <= 0) {
			return BigDecimal.ZERO;
		}

		BigDecimal occupancy = dwellingUnits.multiply(personsPerDU);
		BigDecimal demand = occupancy.multiply(lpcd);

		log.info("{} Demand :: DU={}, Occupancy={}, LPCD={}, Demand={}", apartmentType, dwellingUnits, occupancy, lpcd,demand);

		return demand.setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);
	}

	private BigDecimal calculateJantaFlatDemand(Property property) {
		BigDecimal du = getDwellingUnits(property);
		return calculateApartmentDemand(du, WSCalculationConstant.JANTA_PERSONS_PER_DU,WSCalculationConstant.RESIDENTIAL_LPCD, "JANTA_FLAT");
	}

	private BigDecimal calculateLIGFlatDemand(Property property) {
		BigDecimal du = getDwellingUnits(property);
		return calculateApartmentDemand(du, WSCalculationConstant.LIG_PERSONS_PER_DU,WSCalculationConstant.RESIDENTIAL_LPCD, "LIG_FLAT");
	}

	private BigDecimal calculateMIGFlatDemand(Property property) {
		BigDecimal du = getDwellingUnits(property);
		return calculateApartmentDemand(du, WSCalculationConstant.MIG_PERSONS_PER_DU,WSCalculationConstant.RESIDENTIAL_LPCD, "MIG_FLAT");
	}

	private BigDecimal calculateHIGFlatDemand(Property property) {
		BigDecimal du = getDwellingUnits(property);
		return calculateApartmentDemand(du, WSCalculationConstant.HIG_PERSONS_PER_DU,WSCalculationConstant.RESIDENTIAL_LPCD, "HIG_FLAT");
	}

	private BigDecimal calculateGroupHousingDemand(Property property) {
		BigDecimal du = getDwellingUnits(property);
		return calculateApartmentDemand(du, WSCalculationConstant.GROUP_HOUSING_PERSONS_PER_DU,WSCalculationConstant.RESIDENTIAL_LPCD, "GROUP_HOUSING");
	}

	private BigDecimal calculateEWSFlatDemand(Property property) {
		BigDecimal dwellingUnits = getDwellingUnits(property);
		return calculateApartmentDemand(dwellingUnits, WSCalculationConstant.EWS_PERSONS_PER_DU,WSCalculationConstant.RESIDENTIAL_LPCD, "EWS_FLAT");
	}

	private BigDecimal getCoveredArea(Property property) {
		return getNumericAdditionalDetail(property, WSCalculationConstant.BUILT_UP_AREA);
	}

	private BigDecimal calculateAreaBasedDemand(BigDecimal coveredArea, BigDecimal areaPerPerson, BigDecimal lpcd,String buildingName) {

		if (coveredArea.compareTo(BigDecimal.ZERO) <= 0) {
			return BigDecimal.ZERO;
		}

		BigDecimal occupancy = coveredArea.divide(areaPerPerson, WSCalculationConstant.DIVISION_SCALE,RoundingMode.HALF_UP);
		BigDecimal demand = occupancy.multiply(lpcd);

		log.info("{} Demand :: CoveredArea={}, Occupancy={}, LPCD={}, Demand={}", buildingName, coveredArea, occupancy,lpcd, demand);

		return demand.setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);
	}

	public BigDecimal calculateOfficeDemand(Property property) {
		BigDecimal coveredArea = getCoveredArea(property);
		return calculateAreaBasedDemand(coveredArea, WSCalculationConstant.OFFICE_AREA_PER_PERSON,WSCalculationConstant.OFFICE_LPCD, "OFFICE");
	}

	private BigDecimal getNumericAdditionalDetail(Property property, String key) {
		if (property == null || property.getAdditionalDetails() == null) {
			return BigDecimal.ZERO;
		}

		Map<String, Object> details = mapper.convertValue(property.getAdditionalDetails(),new TypeReference<Map<String, Object>>() {
		});

		Object value = details.get(key);

		if (value == null) {
			log.warn("AdditionalDetails key '{}' not found.", key);
			return BigDecimal.ZERO;
		}

		try {
			return new BigDecimal(value.toString());
		} catch (NumberFormatException ex) {
			log.warn("Invalid numeric value for {} : {}", key, value);
			return BigDecimal.ZERO;
		}
	}

	private BigDecimal getNumberOfBeds(Property property) {
		return getNumericAdditionalDetail(property, WSCalculationConstant.NUMBER_OF_BEDS);
	}

	private BigDecimal calculateHospitalDemand(Property property) {
		BigDecimal beds = getNumberOfBeds(property);

		if (beds.compareTo(BigDecimal.ZERO) <= 0) {
			log.warn("Invalid Number Of Beds.");
			return BigDecimal.ZERO;
		}

		BigDecimal demand = beds.multiply(WSCalculationConstant.HOSPITAL_LPCD);
		log.info("Hospital Demand :: Beds={}, LPCD={}, Demand={}", beds, WSCalculationConstant.HOSPITAL_LPCD, demand);

		return demand.setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);
	}

	private BigDecimal calculateBusinessDemand(Property property) {
		return calculateAreaBasedDemand(getCoveredArea(property), WSCalculationConstant.BUSINESS_AREA_PER_PERSON,
				WSCalculationConstant.BUSINESS_LPCD, "BUSINESS_BUILDING");
	}

	private BigDecimal calculateBankDemand(Property property) {
		return calculateAreaBasedDemand(getCoveredArea(property), WSCalculationConstant.BANK_AREA_PER_PERSON,
				WSCalculationConstant.BANK_LPCD, "BANK");
	}

	private BigDecimal calculateRestaurantDemand(Property property) {
		return calculateAreaBasedDemand(getCoveredArea(property), WSCalculationConstant.RESTAURANT_AREA_PER_PERSON,
				WSCalculationConstant.RESTAURANT_LPCD, "RESTAURANT");
	}

	private BigDecimal calculateShoppingMallDemand(Property property) {
		return calculateAreaBasedDemand(getCoveredArea(property), WSCalculationConstant.MALL_AREA_PER_PERSON,
				WSCalculationConstant.MALL_LPCD, "SHOPPING_MALL");
	}

	private BigDecimal calculateShopDemand(Property property) {
		return calculateAreaBasedDemand(getCoveredArea(property), WSCalculationConstant.SHOP_AREA_PER_PERSON,
				WSCalculationConstant.SHOP_LPCD, "SHOP");
	}

	private BigDecimal calculateCinemaDemand(Property property) {
		return calculateAreaBasedDemand(getCoveredArea(property), WSCalculationConstant.CINEMA_AREA_PER_PERSON,
				WSCalculationConstant.CINEMA_LPCD, "CINEMA");
	}

	private BigDecimal getNumberOfStudents(Property property) {
		return getNumericAdditionalDetail(property, WSCalculationConstant.NUMBER_OF_STUDENTS);
	}

	private BigDecimal calculateSchoolDemand(Property property) {
		BigDecimal students = getNumberOfStudents(property);

		if (students.compareTo(BigDecimal.ZERO) <= 0) {
			log.warn("Invalid Number Of Students.");
			return BigDecimal.ZERO;
		}

		BigDecimal demand = students.multiply(WSCalculationConstant.SCHOOL_LPCD);
		log.info("School Demand :: Students={}, LPCD={}, Demand={}", students, WSCalculationConstant.SCHOOL_LPCD,demand);
		
		return demand.setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);
	}

	private BigDecimal calculateCollegeDemand(Property property) {
		BigDecimal students = getNumberOfStudents(property);

		if (students.compareTo(BigDecimal.ZERO) <= 0) {
			return BigDecimal.ZERO;
		}

		BigDecimal demand = students.multiply(WSCalculationConstant.COLLEGE_LPCD);
		return demand.setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);
	}

	private BigDecimal calculateUniversityDemand(Property property) {
		BigDecimal students = getNumberOfStudents(property);

		if (students.compareTo(BigDecimal.ZERO) <= 0) {
			return BigDecimal.ZERO;
		}

		BigDecimal demand = students.multiply(WSCalculationConstant.UNIVERSITY_LPCD);
		return demand.setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);
	}

	private BigDecimal getNumberOfRooms(Property property) {
		return getNumericAdditionalDetail(property, WSCalculationConstant.NUMBER_OF_ROOMS);
	}

	private BigDecimal calculateHotelDemand(Property property) {
		BigDecimal rooms = getNumberOfRooms(property);

		if (rooms.compareTo(BigDecimal.ZERO) <= 0) {
			log.warn("Invalid Number Of Rooms.");
			return BigDecimal.ZERO;
		}

		BigDecimal occupancy = rooms.multiply(WSCalculationConstant.PERSONS_PER_ROOM);
		BigDecimal demand = occupancy.multiply(WSCalculationConstant.HOTEL_LPCD);

		log.info("Hotel Demand :: Rooms={}, Occupancy={}, Demand={}", rooms, occupancy, demand);

		return demand.setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);
	}

	private BigDecimal calculateHostelDemand(Property property) {
		BigDecimal beds = getNumberOfBeds(property);

		if (beds.compareTo(BigDecimal.ZERO) <= 0) {
			log.warn("Invalid Number Of Beds.");
			return BigDecimal.ZERO;
		}

		BigDecimal demand = beds.multiply(WSCalculationConstant.HOSTEL_LPCD);
		log.info("Hostel Demand :: Beds={}, LPCD={}, Demand={}", beds, WSCalculationConstant.HOSTEL_LPCD, demand);

		return demand.setScale(WSCalculationConstant.RESULT_SCALE, RoundingMode.HALF_UP);
	}

	private BigDecimal calculateIndustrialDemand(Property property) {
		return calculateAreaBasedDemand(getCoveredArea(property), WSCalculationConstant.INDUSTRIAL_AREA_PER_PERSON,
				WSCalculationConstant.INDUSTRIAL_LPCD, "INDUSTRIAL");
	}

	public BigDecimal calculateAverageWaterDemand(Property property, Map<String, Object> masterData) {

		if (property == null) {
			log.warn("Cannot calculate water demand. Property is null.");
			return BigDecimal.ZERO;
		}
		BuildingType buildingType = resolveBuildingType(property, masterData);
		log.info("Resolved Building Type : {}", buildingType);

		BigDecimal calculatedDemand = BigDecimal.ZERO;

		switch (buildingType) {

		/* ---------------- Residential ---------------- */

		case INDIVIDUAL_HOUSE:
			log.info("Invoking calculateIndividualHouseDemand()");
			calculatedDemand = calculateIndividualHouseDemand(property);
			break;

		case EWS_FLAT:
		case JANTA_FLAT:
		case LIG_FLAT:
		case MIG_FLAT:
		case HIG_FLAT:
		case GROUP_HOUSING:
		case APARTMENT:
			log.info("Invoking calculateApartmentDemand() for {}", buildingType);
			calculatedDemand = calculateApartmentDemand(property, masterData);
			break;

		/* ---------------- Business / Commercial ---------------- */

		case OFFICE:
			log.info("Invoking calculateOfficeDemand()");
			calculatedDemand = calculateOfficeDemand(property);
			break;

		case BUSINESS_BUILDING:
			log.info("Invoking calculateBusinessDemand()");
			calculatedDemand = calculateBusinessDemand(property);
			break;

		case BANK:
			log.info("Invoking calculateBankDemand()");
			calculatedDemand = calculateBankDemand(property);
			break;

		case SHOP:
			log.info("Invoking calculateShopDemand()");
			calculatedDemand = calculateShopDemand(property);
			break;

		case SHOPPING_MALL:
			log.info("Invoking calculateShoppingMallDemand()");
			calculatedDemand = calculateShoppingMallDemand(property);
			break;

		case RESTAURANT:
			log.info("Invoking calculateRestaurantDemand()");
			calculatedDemand = calculateRestaurantDemand(property);
			break;

		case CINEMA:
			log.info("Invoking calculateCinemaDemand()");
			calculatedDemand = calculateCinemaDemand(property);
			break;

		/* ---------------- Institutional ---------------- */

		case HOSPITAL:
			log.info("Invoking calculateHospitalDemand()");
			calculatedDemand = calculateHospitalDemand(property);
			break;

		case SCHOOL:
			log.info("Invoking calculateSchoolDemand()");
			calculatedDemand = calculateSchoolDemand(property);
			break;

		case COLLEGE:
			log.info("Invoking calculateCollegeDemand()");
			calculatedDemand = calculateCollegeDemand(property);
			break;

		case UNIVERSITY:
			log.info("Invoking calculateUniversityDemand()");
			calculatedDemand = calculateUniversityDemand(property);
			break;

		case HOTEL:
			log.info("Invoking calculateHotelDemand()");
			calculatedDemand = calculateHotelDemand(property);
			break;

		case INDUSTRIAL:
			log.info("Invoking calculateIndustrialDemand()");
			calculatedDemand = calculateIndustrialDemand(property);
			break;

		case HOSTEL:
			log.info("Invoking calculateHostelDemand()");
			calculatedDemand = calculateHostelDemand(property);
			break;

		default:
			log.warn("Unsupported Building Type : {}", buildingType);
			return BigDecimal.ZERO;
		}

		try {
			Map<String, Object> traceDetails = traceWaterDemandLogDetails(property, masterData);
			
			log.info("======================================================================");
			log.info("               WATER DEMAND CALCULATION REPORT                        ");
			log.info("======================================================================");
			log.info("Property ID          : {}", property.getPropertyId() != null ? property.getPropertyId() : "N/A");
			log.info("Resolved BuildingType: {}", traceDetails.getOrDefault("buildingType", buildingType));
			log.info("Formula Applied      : {}", traceDetails.getOrDefault("formulaUsed", "Standard Base Calculation"));
			
			// --- Inputs Section ---
			if (traceDetails.containsKey("inputCoveredAreaSqMtr")) {
				log.info("Covered Area (SqMtr) : {}", traceDetails.get("inputCoveredAreaSqMtr"));
			}
			if (traceDetails.containsKey("inputDwellingUnits")) {
				log.info("Dwelling Units (DU)  : {}", traceDetails.get("inputDwellingUnits"));
			}
			if (traceDetails.containsKey("inputBedsCount")) {
				log.info("Total Beds Count     : {}", traceDetails.get("inputBedsCount"));
			}
			if (traceDetails.containsKey("inputStudentsCount")) {
				log.info("Total Students Count : {}", traceDetails.get("inputStudentsCount"));
			}
			if (traceDetails.containsKey("inputRoomsCount")) {
				log.info("Total Rooms Count    : {}", traceDetails.get("inputRoomsCount"));
			}
			
			// --- Occupancy Breakdown ---
			if (traceDetails.containsKey("occupancyDivisorOrFactor")) {
				log.info("Density/DU Factor    : {}", traceDetails.get("occupancyDivisorOrFactor")); 
			}
			if (traceDetails.containsKey("calculatedPersons")) {
				log.info("Calculated Occupancy : {} Persons", traceDetails.get("calculatedPersons"));
			}
			
			// --- Final Output Section ---
			if (traceDetails.containsKey("appliedLpcd")) {
				log.info("Applied LPCD Rate    : {} Liters", traceDetails.get("appliedLpcd"));
			}
			log.info("----------------------------------------------------------------------");
			log.info("TOTAL CALCULATED DEMAND : {} LPD", calculatedDemand);
			log.info("======================================================================");
			
		} catch (Exception e) {
			log.error("Error printing water demand breakdown report logs", e);
		}
		
		return calculatedDemand;
	}
	
	/**
	 * Resolves properties factors dynamically to inject inside the demand log trace.
	 */
	public Map<String, Object> traceWaterDemandLogDetails(Property property, Map<String, Object> masterData) {
		Map<String, Object> trace = new LinkedHashMap<>();
		try {
			BuildingType type = resolveBuildingType(property, masterData);
			trace.put("buildingType", type.toString());

			BigDecimal coveredArea = getCoveredArea(property);
			BigDecimal calculatedPersons = BigDecimal.ZERO;

			switch (type) {
			case INDIVIDUAL_HOUSE:
				if (coveredArea.compareTo(BigDecimal.ZERO) > 0) {
					calculatedPersons = coveredArea.divide(WSCalculationConstant.RESIDENTIAL_AREA_PER_PERSON, 
							WSCalculationConstant.DIVISION_SCALE, RoundingMode.HALF_UP);
				}
				trace.put("formulaUsed", "Occupancy = (Covered Area / 25) -> Demand = Occupancy * 135 LPCD");
				trace.put("inputCoveredAreaSqMtr", coveredArea);
				trace.put("occupancyDivisorOrFactor", WSCalculationConstant.RESIDENTIAL_AREA_PER_PERSON + " SqMtr per Person");
				trace.put("calculatedPersons", calculatedPersons);
				trace.put("appliedLpcd", WSCalculationConstant.RESIDENTIAL_LPCD);
				break;

			case EWS_FLAT:
			case JANTA_FLAT:
			case LIG_FLAT:
			case MIG_FLAT:
			case HIG_FLAT:
			case GROUP_HOUSING:
			case APARTMENT:
				BigDecimal du = getDwellingUnits(property);
				BigDecimal factor = WSCalculationConstant.GROUP_HOUSING_PERSONS_PER_DU; // default fallback
				
				if (type == BuildingType.EWS_FLAT) factor = WSCalculationConstant.EWS_PERSONS_PER_DU;
				else if (type == BuildingType.JANTA_FLAT) factor = WSCalculationConstant.JANTA_PERSONS_PER_DU;
				else if (type == BuildingType.LIG_FLAT) factor = WSCalculationConstant.LIG_PERSONS_PER_DU;
				else if (type == BuildingType.MIG_FLAT) factor = WSCalculationConstant.MIG_PERSONS_PER_DU;
				else if (type == BuildingType.HIG_FLAT) factor = WSCalculationConstant.HIG_PERSONS_PER_DU;

				calculatedPersons = du.multiply(factor);
				
				trace.put("formulaUsed", "Occupancy = Dwelling Units * PersonsPerDU -> Demand = Occupancy * 135 LPCD");
				trace.put("inputDwellingUnits", du);
				trace.put("occupancyDivisorOrFactor", factor + " Persons per DU");
				trace.put("calculatedPersons", calculatedPersons);
				trace.put("appliedLpcd", WSCalculationConstant.RESIDENTIAL_LPCD);
				break;

			case HOSPITAL:
				BigDecimal beds = getNumberOfBeds(property);
				trace.put("formulaUsed", "Demand = Total Beds * 340 LPCD");
				trace.put("inputBedsCount", beds);
				trace.put("occupancyDivisorOrFactor", "1 Person per Bed");
				trace.put("calculatedPersons", beds);
				trace.put("appliedLpcd", WSCalculationConstant.HOSPITAL_LPCD);
				break;

			case SCHOOL:
			case COLLEGE:
			case UNIVERSITY:
				BigDecimal students = getNumberOfStudents(property);
				BigDecimal eduLpcd = WSCalculationConstant.SCHOOL_LPCD;
				if (type == BuildingType.COLLEGE) eduLpcd = WSCalculationConstant.COLLEGE_LPCD;
				else if (type == BuildingType.UNIVERSITY) eduLpcd = WSCalculationConstant.UNIVERSITY_LPCD;

				trace.put("formulaUsed", "Demand = Total Students * LPCD Value");
				trace.put("inputStudentsCount", students);
				trace.put("occupancyDivisorOrFactor", "1 Person per Student");
				trace.put("calculatedPersons", students);
				trace.put("appliedLpcd", eduLpcd);
				break;

			case HOTEL:
				BigDecimal rooms = getNumberOfRooms(property);
				calculatedPersons = rooms.multiply(WSCalculationConstant.PERSONS_PER_ROOM);
				trace.put("formulaUsed", "Occupancy = Rooms * 2 -> Demand = Occupancy * 180 LPCD");
				trace.put("inputRoomsCount", rooms);
				trace.put("occupancyDivisorOrFactor", WSCalculationConstant.PERSONS_PER_ROOM + " Persons per Room");
				trace.put("calculatedPersons", calculatedPersons);
				trace.put("appliedLpcd", WSCalculationConstant.HOTEL_LPCD);
				break;

			case HOSTEL:
				BigDecimal hostelBeds = getNumberOfBeds(property);
				trace.put("formulaUsed", "Demand = Total Beds * 135 LPCD");
				trace.put("inputBedsCount", hostelBeds);
				trace.put("occupancyDivisorOrFactor", "1 Person per Bed");
				trace.put("calculatedPersons", hostelBeds);
				trace.put("appliedLpcd", WSCalculationConstant.HOSTEL_LPCD);
				break;

			case OFFICE:
			case BUSINESS_BUILDING:
			case BANK:
			case SHOP:
			case SHOPPING_MALL:
			case RESTAURANT:
			case CINEMA:
			case INDUSTRIAL:
			default:
				BigDecimal areaFactor = WSCalculationConstant.SHOP_AREA_PER_PERSON; // default fallback
				BigDecimal commLpcd = WSCalculationConstant.SHOP_LPCD;

				if (type == BuildingType.OFFICE) {
					areaFactor = WSCalculationConstant.OFFICE_AREA_PER_PERSON;
					commLpcd = WSCalculationConstant.OFFICE_LPCD;
				} else if (type == BuildingType.BUSINESS_BUILDING) {
					areaFactor = WSCalculationConstant.BUSINESS_AREA_PER_PERSON;
					commLpcd = WSCalculationConstant.BUSINESS_LPCD;
				} else if (type == BuildingType.BANK) {
					areaFactor = WSCalculationConstant.BANK_AREA_PER_PERSON;
					commLpcd = WSCalculationConstant.BANK_LPCD;
				} else if (type == BuildingType.SHOPPING_MALL) {
					areaFactor = WSCalculationConstant.MALL_AREA_PER_PERSON;
					commLpcd = WSCalculationConstant.MALL_LPCD;
				} else if (type == BuildingType.RESTAURANT) {
					areaFactor = WSCalculationConstant.RESTAURANT_AREA_PER_PERSON;
					commLpcd = WSCalculationConstant.RESTAURANT_LPCD;
				} else if (type == BuildingType.CINEMA) {
					areaFactor = WSCalculationConstant.CINEMA_AREA_PER_PERSON;
					commLpcd = WSCalculationConstant.CINEMA_LPCD;
				} else if (type == BuildingType.INDUSTRIAL) {
					areaFactor = WSCalculationConstant.INDUSTRIAL_AREA_PER_PERSON;
					commLpcd = WSCalculationConstant.INDUSTRIAL_LPCD;
				}

				if (coveredArea.compareTo(BigDecimal.ZERO) > 0) {
					calculatedPersons = coveredArea.divide(areaFactor, WSCalculationConstant.DIVISION_SCALE, RoundingMode.HALF_UP);
				}

				trace.put("formulaUsed", "Area Based Standard Demand :: (Covered Area / AreaPerPerson) * LPCD");
				trace.put("inputCoveredAreaSqMtr", coveredArea);
				trace.put("occupancyDivisorOrFactor", areaFactor + " SqMtr per Person");
				trace.put("calculatedPersons", calculatedPersons);
				trace.put("appliedLpcd", commLpcd);
				break;
			}
		} catch (Exception e) {
			trace.put("errorTracingLogs", e.getMessage());
		}
		return trace;
	}

}