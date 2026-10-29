package org.upyog.rs.repository.querybuilder;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;
import org.upyog.rs.config.RequestServiceConfiguration;
import org.upyog.rs.web.models.mobileToilet.MobileToiletBookingSearchCriteria;
import org.upyog.rs.web.models.waterTanker.FixedFillingPointMapping;
import org.upyog.rs.web.models.waterTanker.WaterTankerBookingSearchCriteria;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class RequestServiceQueryBuilder {

    @Autowired
    private RequestServiceConfiguration requestServiceConfiguration;

    private static final String WATER_TANKER_BOOKING_DETAILS_SEARCH_QUERY_WITH_PROFILE = (
            "SELECT ursbd.booking_id, booking_no,applicant_uuid, mobile_number, locality_code, tanker_type, water_type, tanker_quantity, water_quantity, description, " +
                    "delivery_date, delivery_time, extra_charge, vendor_id, vehicle_id, driver_id, vehicle_type,payment_receipt_filestore_id, " +
                    "vehicle_capacity,address_detail_id, booking_status, ursbd.createdby, ursbd.lastModifiedby, ursbd.createdtime, " +
                    "ursbd.lastmodifiedtime, ursbd.tenant_id, ursbd.filling_point_id " +
                    "FROM public.upyog_rs_water_tanker_booking_details ursbd"
    );
    
//    private static final String WATER_TANKER_BOOKING_DETAILS_SEARCH_QUERY = (
//            "SELECT ursbd.booking_id, ursbd.booking_no, ursbd.applicant_uuid, ursbd.mobile_number, ursbd.locality_code, ursbd.tanker_type, ursbd.water_type, ursbd.tanker_quantity, ursbd.water_quantity, ursbd.description, " +
//                    "ursbd.delivery_date, ursbd.delivery_time, ursbd.extra_charge, ursbd.vendor_id, ursbd.vehicle_id, ursbd.driver_id, ursbd.vehicle_type, ursbd.payment_receipt_filestore_id, " +
//                    "ursbd.vehicle_capacity, ursbd.address_detail_id, ursbd.booking_status, ursbd.createdby, ursbd.lastModifiedby, ursbd.createdtime, " +
//                    "ursbd.lastmodifiedtime, ursbd.tenant_id, ursbd.wt_file_store_id, ursbd.filling_point_id," +
//                    "urad.applicant_id, urad.name, urad.mobile_number as applicant_mobile, urad.email_id, urad.alternate_number, " +
//                    "uraddr.address_id, uraddr.house_no, uraddr.address_line_1, uraddr.address_line_2, uraddr.street_name, " +
//                    "uraddr.landmark, uraddr.city, uraddr.city_code, uraddr.locality, uraddr.locality_code as addr_locality_code, uraddr.pincode, " +
//                    "uraddr.latitude, uraddr.longitude, uraddr.ward, uraddr.zone, uraddr.constituency "+
//                    "FROM public.upyog_rs_water_tanker_booking_details ursbd " +
//                    "INNER JOIN public.upyog_rs_water_tanker_applicant_details urad ON ursbd.booking_id = urad.booking_id " +
//                    "INNER JOIN public.upyog_rs_water_tanker_address_details uraddr ON urad.applicant_id = uraddr.applicant_id"
//    );

    private static final String WATER_TANKER_BOOKING_DETAILS_SEARCH_QUERY = (
            "SELECT ursbd.booking_id, ursbd.booking_no, ursbd.applicant_uuid, ursbd.mobile_number, ursbd.locality_code, " +
                    "ursbd.tanker_type, ursbd.water_type, ursbd.tanker_quantity, ursbd.water_quantity, ursbd.description, " +
                    "ursbd.delivery_date, ursbd.delivery_time, ursbd.extra_charge, ursbd.vendor_id, ursbd.vehicle_id, " +
                    "ursbd.driver_id, ursbd.vehicle_type, ursbd.payment_receipt_filestore_id, ursbd.vehicle_capacity, " +
                    "ursbd.address_detail_id, ursbd.booking_status, ursbd.createdby, ursbd.lastModifiedby, ursbd.createdtime, " +
                    "ursbd.lastmodifiedtime, ursbd.tenant_id, ursbd.wt_file_store_id, ursbd.filling_point_id, " +
                    // Applicant details
                    "urad.applicant_id, urad.name, urad.mobile_number AS applicant_mobile, urad.email_id, urad.alternate_number, " +
                    // Address details
                    "uraddr.address_id, uraddr.house_no, uraddr.address_line_1, uraddr.address_line_2, uraddr.street_name, " +
                    "uraddr.landmark, uraddr.city, uraddr.city_code, uraddr.locality, uraddr.locality_code AS addr_locality_code, " +
                    "uraddr.pincode, uraddr.latitude, uraddr.longitude, uraddr.ward, uraddr.zone, uraddr.constituency, " +
                    // FillingPoint details
                    "urfp.filling_point_name AS fp_name, urfp.emergency_name, " +
                    "urfp.ee_name, urfp.ee_email AS ee_email_id, urfp.ee_mobile AS ee_mobile_number, " +
                    "urfp.ae_name, urfp.ae_email AS ae_email_id, urfp.ae_mobile AS ae_mobile_number, " +
                    "urfp.je_name, urfp.je_email AS je_email_id, urfp.je_mobile AS je_mobile_number " +
                    "FROM public.upyog_rs_water_tanker_booking_details ursbd " +
                    "LEFT JOIN public.upyog_rs_water_tanker_applicant_details urad ON ursbd.applicant_id = urad.applicant_id " +
                    "LEFT JOIN public.upyog_rs_water_tanker_address_details uraddr ON ursbd.applicant_id = uraddr.applicant_id  " +
                    "LEFT JOIN public.upyog_rs_water_tanker_filling_point urfp ON ursbd.filling_point_id = urfp.id"
    );

    private static final String MOBILE_TOILET_BOOKING_DETAILS_SEARCH_QUERY_WITH_PROFILE = (
            "SELECT urmt.booking_id, booking_no, applicant_uuid, no_of_mobile_toilet, mobile_number, locality_code, " +
                    "description, delivery_from_date, delivery_to_date, delivery_from_time, delivery_to_time, vendor_id, " +
                    "vehicle_id, driver_id, vehicle_type, vehicle_capacity,address_detail_id, payment_receipt_filestore_id,booking_status, urmt.createdby, " +
                    "urmt.lastModifiedby, urmt.createdtime, urmt.lastmodifiedtime, urmt.tenant_id " +
                    "FROM public.upyog_rs_mobile_toilet_booking_details urmt"
    );
    
    private static final String MOBILE_TOILET_BOOKING_DETAILS_SEARCH_QUERY = (
            "SELECT urmt.booking_id, urmt.booking_no, urmt.applicant_uuid, urmt.no_of_mobile_toilet, urmt.mobile_number, urmt.locality_code, " +
                    "urmt.description, urmt.delivery_from_date, urmt.delivery_to_date, urmt.delivery_from_time, urmt.delivery_to_time, urmt.vendor_id, " +
                    "urmt.vehicle_id, urmt.driver_id, urmt.vehicle_type, urmt.vehicle_capacity, urmt.address_detail_id, urmt.payment_receipt_filestore_id, urmt.booking_status, urmt.createdby, " +
                    "urmt.lastModifiedby, urmt.createdtime, urmt.lastmodifiedtime, urmt.tenant_id, " +
                    "urad.applicant_id, urad.name, urad.mobile_number as applicant_mobile, urad.email_id, urad.alternate_number, " +
                    "uraddr.address_id, uraddr.house_no, uraddr.address_line_1, uraddr.address_line_2, uraddr.street_name, " +
                    "uraddr.landmark, uraddr.city, uraddr.city_code, uraddr.locality, uraddr.locality_code as addr_locality_code, uraddr.pincode, " +
                    "uraddr.latitude, uraddr.longitude "+
                    "FROM public.upyog_rs_mobile_toilet_booking_details urmt " +
                    "INNER JOIN public.upyog_rs_mobile_toilet_applicant_details urad ON urmt.booking_id = urad.booking_id " +
                    "INNER JOIN public.upyog_rs_mobile_toilet_address_details uraddr ON urad.applicant_id = uraddr.applicant_id"
    );

    private final String paginationWrapper =
            "SELECT * FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY createdtime DESC) AS offset_ FROM ({}) result) result_offset " +
                    "WHERE offset_ > ? AND offset_ <= ?";

    private static final String waterTankerBookingCount =
            "SELECT count(ursbd.booking_id) FROM upyog_rs_water_tanker_booking_details ursbd";

    private static final String mobileToiletBookingCount =
            "SELECT count(urmt.booking_id) FROM upyog_rs_mobile_toilet_booking_details urmt";


    public String getWaterTankerQuery(WaterTankerBookingSearchCriteria criteria, List<Object> preparedStmtList) {

        StringBuilder query;

        if (!criteria.isCountCall()) {
            // Use different query based on isProfileEnabled
            if (requestServiceConfiguration.getIsUserProfileEnabled()) {
                query = new StringBuilder(WATER_TANKER_BOOKING_DETAILS_SEARCH_QUERY_WITH_PROFILE);
            } else {
                query = new StringBuilder(WATER_TANKER_BOOKING_DETAILS_SEARCH_QUERY);
            }
        } else {
            query = new StringBuilder(waterTankerBookingCount);
        }


      //  query.append(" WHERE 1=1 ");

        if (!ObjectUtils.isEmpty(criteria.getTenantId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.tenant_id LIKE ? ");
            preparedStmtList.add("%" + criteria.getTenantId() + "%");
        }
        // Apply citizen/creator filter if present
        if (criteria.getCreatedBy() != null && !criteria.getCreatedBy().isEmpty()) {
            addClauseIfRequired(query, preparedStmtList);
            String placeholders = String.join(",", Collections.nCopies(criteria.getCreatedBy().size(), "?"));
            query.append(" ( ursbd.createdby IN (").append(placeholders).append(") OR ursbd.applicant_uuid IN (").append(placeholders).append(") ");
            preparedStmtList.addAll(criteria.getCreatedBy());
            preparedStmtList.addAll(criteria.getCreatedBy());
            if (!ObjectUtils.isEmpty(criteria.getMobileNumber())) {
                query.append(" OR ursbd.mobile_number LIKE ? ");
                preparedStmtList.add("%" + criteria.getMobileNumber() + "%");
            }
            query.append(" ) ");

            // Apply bookingNo filter ONLY if present
            if (!ObjectUtils.isEmpty(criteria.getBookingNo())) {
                addClauseIfRequired(query, preparedStmtList);
                String[] bookingNumbers = criteria.getBookingNo().split(",");
                String placeholdersBn = String.join(",", Collections.nCopies(bookingNumbers.length, "?"));
                query.append(" ursbd.booking_no IN (").append(placeholdersBn).append(") ");
                Collections.addAll(preparedStmtList, bookingNumbers);
            }
        } else {
            // Apply bookingNo / mobileNumber filter ONLY if present
            if (!ObjectUtils.isEmpty(criteria.getBookingNo()) || !ObjectUtils.isEmpty(criteria.getMobileNumber())) {

                addClauseIfRequired(query, preparedStmtList);
                query.append(" ( ");

                // bookingNo
                if (!ObjectUtils.isEmpty(criteria.getBookingNo())) {

                    String[] bookingNumbers = criteria.getBookingNo().split(",");
                    String placeholders = String.join(",", Collections.nCopies(bookingNumbers.length, "?"));

                    query.append(" ursbd.booking_no IN (").append(placeholders).append(") ");
                    Collections.addAll(preparedStmtList, bookingNumbers);
                }

                // mobileNumber
                if (!ObjectUtils.isEmpty(criteria.getMobileNumber())) {

                    if (!ObjectUtils.isEmpty(criteria.getBookingNo())) {
                        query.append(" AND ");   // ✅ OR is correct for search
                    }

                    query.append(" ursbd.mobile_number LIKE ? ");
                    preparedStmtList.add("%" + criteria.getMobileNumber() + "%");
                }

                query.append(" ) ");
            }
        }

        if(!ObjectUtils.isEmpty(criteria.getLocalityCode())){
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.locality_code = ? ");
            preparedStmtList.add(criteria.getLocalityCode());
        }

        if (!ObjectUtils.isEmpty(criteria.getStatus())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.booking_status = ? ");
            preparedStmtList.add(criteria.getStatus());
        }

        if (!ObjectUtils.isEmpty(criteria.getDriverId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.driver_id = ? ");
            preparedStmtList.add(criteria.getDriverId());
        }
        if (criteria.getFromDate() != null) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.createdtime >= ? ");
            preparedStmtList.add(criteria.getFromDate());
        }

        if (criteria.getToDate() != null) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.createdtime <= ? ");
            preparedStmtList.add(criteria.getToDate());
        }

        if (!ObjectUtils.isEmpty(criteria.getApplicationType())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.application_type = ? ");
            preparedStmtList.add(criteria.getApplicationType());
        }


        // Existing single driverId check (leave as is)
        if (!ObjectUtils.isEmpty(criteria.getDriverId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.driver_id = ? ");
            preparedStmtList.add(criteria.getDriverId());
        }

        // 1. FILTER BY VENDOR IDS
        if (criteria.getVendorIds() != null && !criteria.getVendorIds().isEmpty()) {
            addClauseIfRequired(query, preparedStmtList);
            String placeholders = String.join(",", Collections.nCopies(criteria.getVendorIds().size(), "?"));
            query.append(" ursbd.vendor_id IN (").append(placeholders).append(") ");
            preparedStmtList.addAll(criteria.getVendorIds());
        }

        // 2. FILTER BY VEHICLE IDS
        if (criteria.getVehicleIds() != null && !criteria.getVehicleIds().isEmpty()) {
            addClauseIfRequired(query, preparedStmtList);
            String placeholders = String.join(",", Collections.nCopies(criteria.getVehicleIds().size(), "?"));
            query.append(" ursbd.vehicle_id IN (").append(placeholders).append(") ");
            preparedStmtList.addAll(criteria.getVehicleIds());
        }

        // 3. FILTER BY DRIVER IDS (List)
        if (criteria.getDriverIds() != null && !criteria.getDriverIds().isEmpty()) {
            addClauseIfRequired(query, preparedStmtList);
            String placeholders = String.join(",", Collections.nCopies(criteria.getDriverIds().size(), "?"));
            query.append(" ursbd.driver_id IN (").append(placeholders).append(") ");
            preparedStmtList.addAll(criteria.getDriverIds());
        }

        // FILTER BY FILLING POINT ID
        if (!ObjectUtils.isEmpty(criteria.getFillingPointId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.filling_point_id = ? ");
            preparedStmtList.add(criteria.getFillingPointId());
        }

        // Return count query directly without applying pagination
        if (criteria.isCountCall()) {
            return query.toString();
        }

        // Apply pagination for non-count queries
        return addPaginationWrapper(query.toString(), preparedStmtList, criteria);

    }

    public String getMobileToiletQuery(MobileToiletBookingSearchCriteria criteria, List<Object> preparedStmtList) {

        StringBuilder query;

        if (!criteria.isCountCall()) {
            // Use different query based on isProfileEnabled
            if (requestServiceConfiguration.getIsUserProfileEnabled()) {
                query = new StringBuilder(MOBILE_TOILET_BOOKING_DETAILS_SEARCH_QUERY_WITH_PROFILE);
            } else {
                query = new StringBuilder(MOBILE_TOILET_BOOKING_DETAILS_SEARCH_QUERY);
            }
        } else {
            query = new StringBuilder(mobileToiletBookingCount);
        }

        if (!ObjectUtils.isEmpty(criteria.getTenantId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" urmt.tenant_id LIKE ? ");
            preparedStmtList.add("%" + criteria.getTenantId() + "%");
        }
        if (requestServiceConfiguration.getIsUserProfileEnabled()) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" urmt.applicant_uuid IS NOT NULL ");
        } else {
            // If user profile is not enabled, we don't need to filter by applicant UUID
            addClauseIfRequired(query, preparedStmtList);
            query.append(" urmt.applicant_uuid IS NULL ");
        }

        if (!ObjectUtils.isEmpty(criteria.getBookingNo())) {
            addClauseIfRequired(query, preparedStmtList);

            // Create a comma-separated string of placeholders
            String bookingNosPlaceholders = String.join(",",
                    Collections.nCopies(criteria.getBookingNo().split(",").length, "?")
            );

            query.append(" urmt.booking_no IN (").append(bookingNosPlaceholders).append(")");

            // Add the booking numbers to the preparedStmtList
            String[] bookingNumbers = criteria.getBookingNo().split(",");
            Collections.addAll(preparedStmtList, bookingNumbers);
        }

        if (!ObjectUtils.isEmpty(criteria.getMobileNumber())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" urmt.mobile_number = ? ");
            preparedStmtList.add(criteria.getMobileNumber());
        }

        if(!ObjectUtils.isEmpty(criteria.getLocalityCode())){
            addClauseIfRequired(query, preparedStmtList);
            query.append(" urmt.locality_code = ? ");
            preparedStmtList.add(criteria.getLocalityCode());
        }

        if (!ObjectUtils.isEmpty(criteria.getStatus())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" urmt.booking_status = ? ");
            preparedStmtList.add(criteria.getStatus());
        }

        // Return count query directly without applying pagination
        if (criteria.isCountCall()) {
            return query.toString();
        }

        // Apply pagination for non-count queries
        return addPaginationWrapper(query.toString(), preparedStmtList, criteria);
    }


    private void addClauseIfRequired(StringBuilder query, List<Object> preparedStmtList) {
        if (preparedStmtList.isEmpty()) {
            query.append(" WHERE ");
        } else {
            query.append(" AND ");
        }
    }

    private String addPaginationWrapper(String query, List<Object> preparedStmtList,
                                        WaterTankerBookingSearchCriteria criteria) {

        int limit = requestServiceConfiguration.getDefaultLimit();
        int offset = requestServiceConfiguration.getDefaultOffset();
        String finalQuery = paginationWrapper.replace("{}", query);

        if (criteria.getLimit() == null && criteria.getOffset() == null) {
            limit = requestServiceConfiguration.getMaxSearchLimit();
        }

        if (criteria.getLimit() != null && criteria.getLimit() <= requestServiceConfiguration.getMaxSearchLimit()) {
            limit = criteria.getLimit();
        }

        if (criteria.getLimit() != null && criteria.getLimit() > requestServiceConfiguration.getMaxSearchLimit()) {
            limit = requestServiceConfiguration.getMaxSearchLimit();
        }

        if (criteria.getOffset() != null)
            offset = criteria.getOffset();

        if (limit == -1) {
            finalQuery = finalQuery.replace("WHERE offset_ > ? AND offset_ <= ?", "");
        } else {
            preparedStmtList.add(offset);
            preparedStmtList.add(offset+limit);
        }

        return finalQuery;

    }

    private String addPaginationWrapper(String query, List<Object> preparedStmtList,
                                        MobileToiletBookingSearchCriteria criteria) {

        int limit = requestServiceConfiguration.getDefaultLimit();
        int offset = requestServiceConfiguration.getDefaultOffset();
        String finalQuery = paginationWrapper.replace("{}", query);

        if (criteria.getLimit() == null && criteria.getOffset() == null) {
            limit = requestServiceConfiguration.getMaxSearchLimit();
        }

        if (criteria.getLimit() != null && criteria.getLimit() <= requestServiceConfiguration.getMaxSearchLimit()) {
            limit = criteria.getLimit();
        }

        if (criteria.getLimit() != null && criteria.getLimit() > requestServiceConfiguration.getMaxSearchLimit()) {
            limit = requestServiceConfiguration.getMaxSearchLimit();
        }

        if (criteria.getOffset() != null)
            offset = criteria.getOffset();

        if (limit == -1) {
            finalQuery = finalQuery.replace("WHERE offset_ > ? AND offset_ <= ?", "");
        } else {
            preparedStmtList.add(offset);
            preparedStmtList.add(offset+limit);
        }

        return finalQuery;

    }


    private static final String WATER_TANKER_STATUS_COUNT_QUERY =
            "SELECT booking_status, application_type, COUNT(*) AS cnt " +
                    "FROM public.upyog_rs_water_tanker_booking_details ursbd";


    public String getWaterTankerStatusCountQuery(WaterTankerBookingSearchCriteria criteria,
                                                 List<Object> preparedStmtList) {
        StringBuilder query = new StringBuilder(WATER_TANKER_STATUS_COUNT_QUERY);

        if (!ObjectUtils.isEmpty(criteria.getTenantId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.tenant_id LIKE ? ");
            preparedStmtList.add("%" + criteria.getTenantId() + "%");
        }

        if (criteria.getCreatedBy() != null && !criteria.getCreatedBy().isEmpty()) {
            addClauseIfRequired(query, preparedStmtList);
            String placeholders = String.join(",", Collections.nCopies(criteria.getCreatedBy().size(), "?"));
            query.append(" ( ursbd.createdby IN (").append(placeholders).append(") OR ursbd.applicant_uuid IN (").append(placeholders).append(") ");
            preparedStmtList.addAll(criteria.getCreatedBy());
            preparedStmtList.addAll(criteria.getCreatedBy());
            if (!ObjectUtils.isEmpty(criteria.getMobileNumber())) {
                query.append(" OR ursbd.mobile_number LIKE ? ");
                preparedStmtList.add("%" + criteria.getMobileNumber() + "%");
            }
            query.append(" ) ");
        } else if (!ObjectUtils.isEmpty(criteria.getMobileNumber())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.mobile_number LIKE ? ");
            preparedStmtList.add("%" + criteria.getMobileNumber() + "%");
        }

        if (criteria.getVendorIds() != null && !criteria.getVendorIds().isEmpty()) {
            addClauseIfRequired(query, preparedStmtList);
            String placeholders = String.join(",", Collections.nCopies(criteria.getVendorIds().size(), "?"));
            query.append(" ursbd.vendor_id IN (").append(placeholders).append(") ");
            preparedStmtList.addAll(criteria.getVendorIds());
        }

        if (criteria.getFromDate() != null) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.createdtime >= ? ");
            preparedStmtList.add(criteria.getFromDate());
        }

        if (criteria.getToDate() != null) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.createdtime <= ? ");
            preparedStmtList.add(criteria.getToDate());
        }

        // If applicationType is provided, filter to that type only.
        // Otherwise return counts for BOTH types (grouped by application_type).
        if (!ObjectUtils.isEmpty(criteria.getApplicationType())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.application_type = ? ");
            preparedStmtList.add(criteria.getApplicationType());
        }

        if (!ObjectUtils.isEmpty(criteria.getLocalityCode())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.locality_code = ? ");
            preparedStmtList.add(criteria.getLocalityCode());
        }

        query.append(" GROUP BY booking_status, application_type ORDER BY booking_status ");
        return query.toString();
    }

    public String getWaterTankerTotalCountQuery(WaterTankerBookingSearchCriteria criteria,
                                                List<Object> preparedStmtList) {

        StringBuilder query = new StringBuilder(waterTankerBookingCount);
        // waterTankerBookingCount = "SELECT count(ursbd.booking_id) FROM upyog_rs_water_tanker_booking_details ursbd"

        if (!ObjectUtils.isEmpty(criteria.getTenantId())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.tenant_id LIKE ? ");
            preparedStmtList.add("%" + criteria.getTenantId() + "%");
        }

        if (criteria.getCreatedBy() != null && !criteria.getCreatedBy().isEmpty()) {
            addClauseIfRequired(query, preparedStmtList);
            String placeholders = String.join(",", Collections.nCopies(criteria.getCreatedBy().size(), "?"));
            query.append(" ( ursbd.createdby IN (").append(placeholders).append(") OR ursbd.applicant_uuid IN (").append(placeholders).append(") ");
            preparedStmtList.addAll(criteria.getCreatedBy());
            preparedStmtList.addAll(criteria.getCreatedBy());
            if (!ObjectUtils.isEmpty(criteria.getMobileNumber())) {
                query.append(" OR ursbd.mobile_number LIKE ? ");
                preparedStmtList.add("%" + criteria.getMobileNumber() + "%");
            }
            query.append(" ) ");
        } else if (!ObjectUtils.isEmpty(criteria.getMobileNumber())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.mobile_number LIKE ? ");
            preparedStmtList.add("%" + criteria.getMobileNumber() + "%");
        }

        if (criteria.getVendorIds() != null && !criteria.getVendorIds().isEmpty()) {
            addClauseIfRequired(query, preparedStmtList);
            String placeholders = String.join(",", Collections.nCopies(criteria.getVendorIds().size(), "?"));
            query.append(" ursbd.vendor_id IN (").append(placeholders).append(") ");
            preparedStmtList.addAll(criteria.getVendorIds());
        }

        if (!ObjectUtils.isEmpty(criteria.getApplicationType())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" ursbd.application_type = ? ");
            preparedStmtList.add(criteria.getApplicationType());
        }

        return query.toString();
    }

    }
