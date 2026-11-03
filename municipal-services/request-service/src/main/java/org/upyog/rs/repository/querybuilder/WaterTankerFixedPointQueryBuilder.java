package org.upyog.rs.repository.querybuilder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.upyog.rs.config.RequestServiceConfiguration;
import org.upyog.rs.web.models.waterTanker.WaterTankerFixedPointBookingSearchCriteria;

import java.util.List;

@Component
public class WaterTankerFixedPointQueryBuilder {

    @Autowired
    private RequestServiceConfiguration config;

    private static final String BASE_QUERY =
            " SELECT DISTINCT ON (ad.fixed_point_id)  " +
                    "ad.applicant_id, " +
                    "ad.name, " +
                    "ad.mobile_number AS applicant_mobile_number, " +
                    "ad.email_id, " +
                    "ad.alternate_number, " +
                    "ad.type AS applicant_type, " +
                    "ad.createdby AS ad_createdby, " +
                    "ad.lastmodifiedby AS ad_lastmodifiedby, " +
                    "ad.createdtime AS ad_createdtime, " +
                    "ad.lastmodifiedtime AS ad_lastmodifiedtime, " +
                    "addr.address_id, " +
                    "addr.house_no, " +
                    "addr.address_line_1, " +
                    "addr.address_line_2, " +
                    "addr.street_name, " +
                    "addr.landmark, " +
                    "addr.city, " +
                    "addr.city_code, " +
                    "addr.locality, " +
                    "addr.locality_code AS addr_locality_code, " +
                    "addr.pincode, " +
                    "addr.latitude AS addr_latitude, " +
                    "addr.longitude AS addr_longitude, " +
                    "addr.type AS addr_type, " +
                    "fp.id AS fp_id, " +
                    "fp.tenant_id AS fp_tenant_id, " +
                    "fp.filling_point_name AS fp_filling_point_name, " +
                    "fp.emergency_name AS fp_emergency_name, " +
                    "fp.ee_name AS fp_ee_name, " +
                    "fp.ee_email AS fp_ee_email, " +
                    "fp.ee_mobile AS fp_ee_mobile, " +
                    "fp.ae_name AS fp_ae_name, " +
                    "fp.ae_email AS fp_ae_email, " +
                    "fp.ae_mobile AS fp_ae_mobile, " +
                    "fp.je_name AS fp_je_name, " +
                    "fp.je_email AS fp_je_email, " +
                    "fp.je_mobile AS fp_je_mobile, " +
                    "fp.createdby AS fp_createdby, " +
                    "fp.lastmodifiedby AS fp_lastmodifiedby, " +
                    "fp.createdtime AS fp_createdtime, " +
                    "fp.lastmodifiedtime AS fp_lastmodifiedtime, " +
                    "fpa.address_id AS fp_address_id, " +
                    "fpa.applicant_id AS fp_address_applicant_id, " +
                    "fpa.house_no AS fp_house_no, " +
                    "fpa.address_line_1 AS fp_address_line_1, " +
                    "fpa.address_line_2 AS fp_address_line_2, " +
                    "fpa.street_name AS fp_street_name, " +
                    "fpa.landmark AS fp_landmark, " +
                    "fpa.city AS fp_city, " +
                    "fpa.city_code AS fp_city_code, " +
                    "fpa.locality AS fp_locality, " +
                    "fpa.locality_code AS fp_locality_code, " +
                    "fpa.pincode AS fp_pincode, " +
                    "fpa.latitude AS fp_addr_latitude, " +
                    "fpa.longitude AS fp_addr_longitude, " +
                    "ad.fixed_point_id AS fixed_point_idgen, " +
                    "fpa.type AS fp_addr_type, " +
                    "addr.ward, addr.zone, addr.constituency " +
                    "FROM upyog_rs_water_tanker_applicant_details ad " +
                    "LEFT JOIN public.upyog_rs_water_tanker_address_details addr " +
                    "ON ad.applicant_id = addr.applicant_id " +
                    //  DISTINCT ON ensures only 1 mapping row per applicant
                    "LEFT JOIN ( " +
                    "    SELECT DISTINCT ON (fixed_pt_name) fixed_pt_name, filling_pt_name " +
                    "    FROM public.upyog_rs_water_tanker_filling_point_fixed_point_mapping " +
                    "    ORDER BY fixed_pt_name " +
                    ") m ON ad.applicant_id = m.fixed_pt_name " +
                    "LEFT JOIN public.upyog_rs_water_tanker_filling_point fp " +
                    "ON m.filling_pt_name = fp.id " +
                    "LEFT JOIN public.upyog_rs_water_tanker_address_details fpa " +
                    "ON fp.id = fpa.applicant_id AND fpa.type = 'FIXED-POINT' ";

    private static final String ORDER_BY = " ORDER BY ad.fixed_point_id ASC ";


    public String getWaterTankerFixedPointQuery(
            WaterTankerFixedPointBookingSearchCriteria criteria,
            List<Object> preparedStmtList) {

        StringBuilder query = new StringBuilder(BASE_QUERY);

        query.append(" WHERE ad.type = ? ");
        preparedStmtList.add("FIXED-POINT");

        //query.append(" WHERE ad.fixed_point_id IS NOT NULL ");

        if (criteria.getCreatedBy() != null && !criteria.getCreatedBy().isEmpty()) {
            String placeholders = String.join(",", java.util.Collections.nCopies(criteria.getCreatedBy().size(), "?"));
            query.append(" AND ( ad.createdby IN (").append(placeholders).append(") ");
            preparedStmtList.addAll(criteria.getCreatedBy());
            if (criteria.getMobileNumber() != null && !criteria.getMobileNumber().trim().isEmpty()) {
                query.append(" OR ad.mobile_number = ? ");
                preparedStmtList.add(criteria.getMobileNumber());
            }
            query.append(" ) ");
        } else if (criteria.getMobileNumber() != null && !criteria.getMobileNumber().trim().isEmpty()) {
            query.append(" AND ad.mobile_number = ? ");
            preparedStmtList.add(criteria.getMobileNumber());
        }

        if (criteria.getName() != null && !criteria.getName().trim().isEmpty()) {
            query.append(" AND ad.name ILIKE ? ");
            preparedStmtList.add("%" + criteria.getName() + "%");
        }

        if (criteria.getFillingPointId() != null && !criteria.getFillingPointId().trim().isEmpty()) {
            query.append(" AND m.filling_pt_name = ? ");
            preparedStmtList.add(criteria.getFillingPointId());
        }

        if (criteria.getId() != null && !criteria.getId().trim().isEmpty()) {
            query.append(" AND ad.applicant_id = ? ");
            preparedStmtList.add(criteria.getId());
        }

        if (criteria.getFixedPointId() != null && !criteria.getFixedPointId().trim().isEmpty()) {
            query.append(" AND ad.fixed_point_id = ? ");
            preparedStmtList.add(criteria.getFixedPointId());
        }

//        if (criteria.getFromDate() != null) {
//            query.append(" AND ad.createdtime >= ? ");
//            preparedStmtList.add(criteria.getFromDate());
//        }
//
//        if (criteria.getToDate() != null) {
//            query.append(" AND ad.createdtime <= ? ");
//            preparedStmtList.add(criteria.getToDate());
//        }

        query.append(" ORDER BY ad.fixed_point_id, ad.createdtime DESC ");

        int limit = (criteria.getLimit() != null && criteria.getLimit() > 0)
                ? Math.min(criteria.getLimit(), config.getMaxSearchLimit())
                : config.getDefaultLimit();
        query.append(" LIMIT ? ");
        preparedStmtList.add(limit);

        int offset = (criteria.getOffset() != null && criteria.getOffset() >= 0)
                ? criteria.getOffset()
                : 0;
        query.append(" OFFSET ? ");
        preparedStmtList.add(offset);

        return query.toString();
    }


    public String getApproximateCountQuery(
            WaterTankerFixedPointBookingSearchCriteria criteria,
            List<Object> preparedStmtList) {

        StringBuilder query = new StringBuilder(
                "SELECT COUNT(DISTINCT ad.fixed_point_id) " +
                        "FROM upyog_rs_water_tanker_applicant_details ad " +
                        "WHERE ad.type = ? "
        );
        preparedStmtList.add("FIXED-POINT");

        if (criteria.getCreatedBy() != null && !criteria.getCreatedBy().isEmpty()) {
            String placeholders = String.join(",", java.util.Collections.nCopies(criteria.getCreatedBy().size(), "?"));
            query.append(" AND ( ad.createdby IN (").append(placeholders).append(") ");
            preparedStmtList.addAll(criteria.getCreatedBy());
            if (criteria.getMobileNumber() != null && !criteria.getMobileNumber().trim().isEmpty()) {
                query.append(" OR ad.mobile_number = ? ");
                preparedStmtList.add(criteria.getMobileNumber());
            }
            query.append(" ) ");
        } else if (criteria.getMobileNumber() != null && !criteria.getMobileNumber().trim().isEmpty()) {
            query.append(" AND ad.mobile_number = ? ");
            preparedStmtList.add(criteria.getMobileNumber());
        }

        if (criteria.getFixedPointId() != null && !criteria.getFixedPointId().trim().isEmpty()) {
            query.append(" AND ad.fixed_point_id = ? ");
            preparedStmtList.add(criteria.getFixedPointId());
        }

        if (criteria.getName() != null && !criteria.getName().trim().isEmpty()) {
            query.append(" AND ad.name ILIKE ? ");
            preparedStmtList.add("%" + criteria.getName() + "%");
        }

        if (criteria.getFillingPointId() != null && !criteria.getFillingPointId().trim().isEmpty()) {
            query.append(" AND ad.applicant_id IN ( " +
                    "SELECT fixed_pt_name FROM upyog_rs_water_tanker_filling_point_fixed_point_mapping " +
                    "WHERE filling_pt_name = ? ) ");
            preparedStmtList.add(criteria.getFillingPointId());
        }

        if (criteria.getId() != null && !criteria.getId().trim().isEmpty()) {
            query.append(" AND ad.applicant_id = ? ");
            preparedStmtList.add(criteria.getId());
        }
//
//        if (criteria.getFromDate() != null) {
//            query.append(" AND ad.createdtime >= ? ");
//            preparedStmtList.add(criteria.getFromDate());
//        }
//
//        if (criteria.getToDate() != null) {
//            query.append(" AND ad.createdtime <= ? ");
//            preparedStmtList.add(criteria.getToDate());
//        }

        return query.toString();
    }

}