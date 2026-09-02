package org.upyog.rs.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.upyog.rs.web.models.Address;
import org.upyog.rs.web.models.fillingpoint.FillingPoint;
import org.upyog.rs.web.models.fillingpoint.FillingPointSearchCriteria;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
public class FillingPointRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void save(List<FillingPoint> list) {

        String query = "INSERT INTO upyog_rs_water_tanker_filling_point " +
                "(id, tenant_id, filling_point_name, emergency_name, " +
                "ee_name, ee_email, ee_mobile, ae_name, ae_email, ae_mobile, " +
                "je_name, je_email, je_mobile, createdby, lastmodifiedby, createdtime, lastmodifiedtime,status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"; // ← VALUES added + 17 ?

        jdbcTemplate.batchUpdate(query, list, list.size(), (ps, fp) -> {
            ps.setString(1, fp.getId());
            ps.setString(2, fp.getTenantId());
            ps.setString(3, fp.getFillingPointName());
            ps.setString(4, fp.getEmergencyName());
            ps.setString(5, fp.getEeName());
            ps.setString(6, fp.getEeEmail());
            ps.setString(7, fp.getEeMobile());
            ps.setString(8, fp.getAeName());
            ps.setString(9, fp.getAeEmail());
            ps.setString(10, fp.getAeMobile());
            ps.setString(11, fp.getJeName());
            ps.setString(12, fp.getJeEmail());
            ps.setString(13, fp.getJeMobile());   // ← added
            ps.setString(14, fp.getCreatedBy());
            ps.setString(15, fp.getLastModifiedBy());
            ps.setLong(16, fp.getCreatedTime());
            ps.setLong(17, fp.getLastModifiedTime());
            ps.setBoolean(18, fp.getStatus());
        });
    }

    public List<FillingPoint> search(FillingPointSearchCriteria criteria) {

        StringBuilder query = new StringBuilder(
                "SELECT fp.id, fp.tenant_id, fp.filling_point_name, fp.emergency_name, " +
                        "fp.ee_name, fp.ee_email, fp.ee_mobile, " +
                        "fp.ae_name, fp.ae_email, fp.ae_mobile, " +
                        "fp.je_name, fp.je_email, fp.je_mobile,fp.status, " +
                        "fp.createdby, fp.lastmodifiedby, fp.createdtime, fp.lastmodifiedtime, " +
                        "ad.address_id, ad.house_no, ad.address_line_1, ad.address_line_2, " +
                        "ad.street_name, ad.landmark, ad.city, ad.city_code, " +
                        "ad.locality, ad.locality_code, ad.pincode, " +
                        "ad.latitude, ad.longitude, ad.type AS addr_type, fp.filling_point_id, " +
                        "ad.ward, ad.zone, ad.constituency, "+
                        "lm.locality_code AS filling_point_locality_code " +
                        "FROM upyog_rs_water_tanker_filling_point fp " +
                        "LEFT JOIN upyog_rs_water_tanker_address_details ad " +
                        "ON ad.applicant_id = fp.id " +
                        "LEFT JOIN filling_point_locality_mapping lm " +
                        "ON lm.filling_point_id = fp.id " +
                        "WHERE fp.tenant_id = ?"
        );

        List<Object> params = new ArrayList<>();
        params.add(criteria.getTenantId());

        // id filter
        if (criteria.getId() != null && !criteria.getId().isEmpty()) {
            query.append(" AND fp.id = ?");
            params.add(criteria.getId());
        }

        if (criteria.getStatus() != null) {
            query.append(" AND fp.status = ?");
            params.add(criteria.getStatus());
        }

        // fillingPointName filter
        if (criteria.getFillingPointName() != null && !criteria.getFillingPointName().isEmpty()) {
            query.append(" AND LOWER(fp.filling_point_name) LIKE LOWER(?)");
            params.add("%" + criteria.getFillingPointName() + "%");
        }

        // Designation filter
        if ("JE".equalsIgnoreCase(criteria.getDesignation())) {
            if (criteria.getName() != null && !criteria.getName().isEmpty()) {
                query.append(" AND fp.je_name = ?");
                params.add(criteria.getName());
            }
            if (criteria.getMobileNo() != null && !criteria.getMobileNo().isEmpty()) {
                query.append(" AND fp.je_mobile = ?");
                params.add(criteria.getMobileNo());
            }
        } else if ("AE".equalsIgnoreCase(criteria.getDesignation())) {
            if (criteria.getName() != null && !criteria.getName().isEmpty()) {
                query.append(" AND fp.ae_name = ?");
                params.add(criteria.getName());
            }
            if (criteria.getMobileNo() != null && !criteria.getMobileNo().isEmpty()) {
                query.append(" AND fp.ae_mobile = ?");
                params.add(criteria.getMobileNo());
            }
        } else if ("EE".equalsIgnoreCase(criteria.getDesignation())) {
            if (criteria.getName() != null && !criteria.getName().isEmpty()) {
                query.append(" AND fp.ee_name = ?");
                params.add(criteria.getName());
            }
            if (criteria.getMobileNo() != null && !criteria.getMobileNo().isEmpty()) {
                query.append(" AND fp.ee_mobile = ?");
                params.add(criteria.getMobileNo());
            }
        }
        query.append(" ORDER BY fp.createdtime DESC");

        if (criteria.getLimit() != null) {
            query.append(" LIMIT ?");
            params.add(criteria.getLimit());
        }

        if (criteria.getOffset() != null) {
            query.append(" OFFSET ?");
            params.add(criteria.getOffset());
        }
        Map<String, FillingPoint> fillingPointMap = new LinkedHashMap<>();

        jdbcTemplate.query(
                query.toString(),
                params.toArray(),
                (ResultSet rs) -> {
                    String id = rs.getString("id");

                    FillingPoint fp = fillingPointMap.computeIfAbsent(id, k -> {
                        FillingPoint newFp = new FillingPoint();
                        newFp.setId(id);
                        try {
                            newFp.setTenantId(rs.getString("tenant_id"));

                        newFp.setFillingPointName(rs.getString("filling_point_name"));
                        newFp.setEmergencyName(rs.getString("emergency_name"));
                        newFp.setEeName(rs.getString("ee_name"));
                        newFp.setEeEmail(rs.getString("ee_email"));
                        newFp.setEeMobile(rs.getString("ee_mobile"));
                        newFp.setAeName(rs.getString("ae_name"));
                        newFp.setAeEmail(rs.getString("ae_email"));
                        newFp.setAeMobile(rs.getString("ae_mobile"));
                        newFp.setJeName(rs.getString("je_name"));
                        newFp.setJeEmail(rs.getString("je_email"));
                        newFp.setJeMobile(rs.getString("je_mobile"));
                        newFp.setCreatedBy(rs.getString("createdby"));
                        newFp.setLastModifiedBy(rs.getString("lastmodifiedby"));
                        newFp.setCreatedTime(rs.getLong("createdtime"));
                        newFp.setLastModifiedTime(rs.getLong("lastmodifiedtime"));
                        newFp.setFillingPointId(rs.getString("filling_point_id"));
                        newFp.setStatus(rs.getBoolean("status"));
                        newFp.setLocalityCodes(new ArrayList<>());

                        String addressId = rs.getString("address_id");
                        if (addressId != null) {
                            Address address = new Address();
                            address.setAddressId(addressId);
                            address.setHouseNo(rs.getString("house_no"));
                            address.setAddressLine1(rs.getString("address_line_1"));
                            address.setAddressLine2(rs.getString("address_line_2"));
                            address.setStreetName(rs.getString("street_name"));
                            address.setLandmark(rs.getString("landmark"));
                            address.setCity(rs.getString("city"));
                            address.setCityCode(rs.getString("city_code"));
                            address.setLocality(rs.getString("locality"));
                            address.setLocalityCode(rs.getString("locality_code"));
                            address.setPincode(rs.getString("pincode"));
                            address.setLatitude(rs.getString("latitude"));
                            address.setLongitude(rs.getString("longitude"));
                            address.setType(rs.getString("addr_type"));
                            address.setWard(rs.getString("ward"));
                            address.setZone(rs.getString("zone"));
                            address.setConstituency(rs.getString("constituency"));
                            newFp.setAddress(address);
                        }
                        } catch (SQLException e) {
                            throw new RuntimeException(e);
                        }
                        return newFp;
                    });

                    String localityCode = rs.getString("filling_point_locality_code");
                    if (localityCode != null
                            && !fp.getLocalityCodes().contains(localityCode)) {
                        fp.getLocalityCodes().add(localityCode);
                    }
                }
        );

        return new ArrayList<>(fillingPointMap.values());
    }



    public void update(List<FillingPoint> list) {

        String query = "UPDATE upyog_rs_water_tanker_filling_point SET " +
                "filling_point_name=?, emergency_name=?, " +
                "ee_name=?, ee_email=?, ee_mobile=?, " +
                "ae_name=?, ae_email=?, ae_mobile=?, " +
                "je_name=?, je_email=?, " +
                "lastmodifiedby=?, lastmodifiedtime=? " +
                "WHERE id=?";

        jdbcTemplate.batchUpdate(query, list, list.size(), (ps, fp) -> {
            ps.setString(1, fp.getFillingPointName());
            ps.setString(2, fp.getEmergencyName());
            ps.setString(3, fp.getEeName());
            ps.setString(4, fp.getEeEmail());
            ps.setString(5, fp.getEeMobile());
            ps.setString(6, fp.getAeName());
            ps.setString(7, fp.getAeEmail());
            ps.setString(8, fp.getAeMobile());
            ps.setString(9, fp.getJeName());
            ps.setString(10, fp.getJeEmail());
            ps.setString(11, fp.getLastModifiedBy());
            ps.setLong(12, fp.getLastModifiedTime());
            ps.setString(13, fp.getId());
        });
    }

    public Integer count(FillingPointSearchCriteria criteria) {

        StringBuilder query = new StringBuilder(
                "SELECT COUNT(DISTINCT fp.id) " +
                        "FROM upyog_rs_water_tanker_filling_point fp " +
                        "LEFT JOIN upyog_rs_water_tanker_address_details ad " +
                        "ON ad.applicant_id = fp.id " +
                        "LEFT JOIN filling_point_locality_mapping lm " +
                        "ON lm.filling_point_id = fp.id " +
                        "WHERE fp.tenant_id = ?"
        );

        List<Object> params = new ArrayList<>();
        params.add(criteria.getTenantId());

        if (criteria.getId() != null && !criteria.getId().isEmpty()) {
            query.append(" AND fp.id = ?");
            params.add(criteria.getId());
        }

        if (criteria.getStatus() != null) {
            query.append(" AND fp.status = ?");
            params.add(criteria.getStatus());
        }

        if (criteria.getFillingPointName() != null && !criteria.getFillingPointName().isEmpty()) {
            query.append(" AND LOWER(fp.filling_point_name) LIKE LOWER(?)");
            params.add("%" + criteria.getFillingPointName() + "%");
        }

        if ("JE".equalsIgnoreCase(criteria.getDesignation())) {

            if (criteria.getName() != null && !criteria.getName().isEmpty()) {
                query.append(" AND fp.je_name = ?");
                params.add(criteria.getName());
            }

            if (criteria.getMobileNo() != null && !criteria.getMobileNo().isEmpty()) {
                query.append(" AND fp.je_mobile = ?");
                params.add(criteria.getMobileNo());
            }

        } else if ("AE".equalsIgnoreCase(criteria.getDesignation())) {

            if (criteria.getName() != null && !criteria.getName().isEmpty()) {
                query.append(" AND fp.ae_name = ?");
                params.add(criteria.getName());
            }

            if (criteria.getMobileNo() != null && !criteria.getMobileNo().isEmpty()) {
                query.append(" AND fp.ae_mobile = ?");
                params.add(criteria.getMobileNo());
            }

        } else if ("EE".equalsIgnoreCase(criteria.getDesignation())) {

            if (criteria.getName() != null && !criteria.getName().isEmpty()) {
                query.append(" AND fp.ee_name = ?");
                params.add(criteria.getName());
            }

            if (criteria.getMobileNo() != null && !criteria.getMobileNo().isEmpty()) {
                query.append(" AND fp.ee_mobile = ?");
                params.add(criteria.getMobileNo());
            }
        }

        return jdbcTemplate.queryForObject(query.toString(), params.toArray(), Integer.class);
    }

    public String getFillingPointUuidByCode(String code) {
        String query = "SELECT id FROM upyog_rs_water_tanker_filling_point WHERE filling_point_id = ?";
        try {
            return jdbcTemplate.queryForObject(query, String.class, code);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
}
