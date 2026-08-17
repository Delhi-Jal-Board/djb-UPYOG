package org.egov.vendor.repository.rowmapper;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.egov.tracer.model.CustomException;
import org.egov.vendor.web.model.AuditDetails;
import org.egov.vendor.web.model.Vendor;
import org.egov.vendor.web.model.Vendor.StatusEnum;
import org.egov.vendor.web.model.VendorAdditionalDetails;
import org.egov.vendor.web.model.VendorWorkOrder;
import org.egov.vendor.web.model.fillingpoint.FillingPoint;
import org.egov.vendor.web.model.location.Address;
import org.egov.vendor.web.model.location.Boundary;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class VendorRowMapper implements ResultSetExtractor<List<Vendor>> {

	@Autowired
	private ObjectMapper mapper;

	private int fullCount = 0;

	public int getFullCount() {
		return fullCount;
	}

	public void setFullCount(int fullCount) {
		this.fullCount = fullCount;
	}

	@SuppressWarnings("rawtypes")
	@Override
	public List<Vendor> extractData(ResultSet rs) throws SQLException {
		Map<String, Vendor> vendorMap = new LinkedHashMap<>();
		this.setFullCount(0);

		while (rs.next()) {
			Vendor currentvendor = new Vendor();
			String id = rs.getString("vendor_id");
			String vendorId = rs.getString("vendor_idgen");
			String name = rs.getString("name");
			currentvendor = vendorMap.get(id);
			String tenantId = rs.getString("tenantid");
			Object additionalDetail = getAdditionalDetail("additionaldetails", rs);
			String ownerId = rs.getString("owner_id");
			String description = rs.getString("description");
			String source = rs.getString("source");
			String status = rs.getString("status");
			String agencytype = rs.getString("agencytype");
			String paymentpreference = rs.getString("paymentpreference");
			this.setFullCount(rs.getInt("full_count"));

			// ── Chunk 2: parse zone_ids, cluster_ids, contract dates ─────────
			List<String> zoneIds    = parseJsonbAsList("zone_ids", rs);
			List<String> clusterIds = parseJsonbAsList("cluster_ids", rs);

			Long contractStartDate = rs.getLong("contract_start_date");
			if (rs.wasNull()) contractStartDate = null;

			Long contractEndDate = rs.getLong("contract_end_date");
			if (rs.wasNull()) contractEndDate = null;
			// ─────────────────────────────────────────────────────────────────

			if (currentvendor == null) {
				if (status == null) {
					status = "ACTIVE";
				}
				currentvendor = Vendor.builder()
						.id(id)
						.vendorIdGen(vendorId)
						.name(name)
						.tenantId(tenantId)
						.agencyType(agencytype)
						.paymentPreference(paymentpreference)
						.additionalDetails(additionalDetail)
						.description(description)
						.source(source)
						.status(StatusEnum.valueOf(status))
						.ownerId(ownerId)
						.vendorWorkOrder(new ArrayList<>())
						// ── Chunk 2 fields ──
						.zoneIds(zoneIds)
						.clusterIds(clusterIds)
						.contractStartDate(contractStartDate)
						.contractEndDate(contractEndDate)
						.build();

				vendorMap.put(id, currentvendor);
			}
			addChildrenToProperty(rs, currentvendor);
			addWorkOrderToVendor(rs, currentvendor);
			addFillingPointToVendor(rs, currentvendor);
			addVendorAdditionalDetailsToVendor(rs, currentvendor);
		}

		return new ArrayList<>(vendorMap.values());
	}

	@SuppressWarnings("unused")
	private void addChildrenToProperty(ResultSet rs, Vendor vendor) throws SQLException {
		AuditDetails auditdetails = AuditDetails.builder().createdBy(rs.getString("createdBy"))
				.createdTime(rs.getLong("createdTime")).lastModifiedBy(rs.getString("lastModifiedBy"))
				.lastModifiedTime(rs.getLong("lastModifiedTime")).build();

		Boundary locality = Boundary.builder().code(rs.getString("locality")).build();

		Double latitude = rs.getObject("latitude") != null ? rs.getDouble("latitude") : null;
		Double longitude = rs.getObject("longitude") != null ? rs.getDouble("longitude") : null;

		Address address = Address.builder().id(rs.getString("vendor_address_id")).tenantId(rs.getString("tenantid"))
				.doorNo(rs.getString("doorno")).plotNo(rs.getString("plotno")).landmark(rs.getString("landmark"))
				.city(rs.getString("city")).district(rs.getString("district")).region(rs.getString("region"))
				.state(rs.getString("state")).country(rs.getString("country")).pincode(rs.getString("pincode"))
				.additionalDetails(rs.getString("additionaldetails")).buildingName(rs.getString("buildingname"))
				.street(rs.getString("street")).locality(locality)
				.latitude(latitude)
				.longitude(longitude)
				.subLocality(rs.getString("sub_locality"))
				.actualAssembly(rs.getString("actual_assembly"))
				.actualZone(rs.getString("actual_zone"))
				.actualWard(rs.getString("actual_ward"))
				.addressLine1(rs.getString("address_line_1"))
				.addressLine2(rs.getString("address_line_2"))
				.assembly(rs.getString("assembly"))
				.block(rs.getString("block"))
				.zone(rs.getString("zone"))
				.build();
		vendor.setAddress(address);
		vendor.setAuditDetails(auditdetails);

	}

	private JsonNode getAdditionalDetail(String columnName, ResultSet rs) {

		JsonNode additionalDetail = null;
		try {
			PGobject pgObj = (PGobject) rs.getObject(columnName);
			if (pgObj != null) {
				additionalDetail = mapper.readTree(pgObj.getValue());
			}
		} catch (IOException | SQLException e) {
			e.printStackTrace();
			throw new CustomException("PARSING_ERROR", "Failed to parse additionalDetail object");
		}
		return additionalDetail;
	}

	/**
	 * Chunk 2 helper — safely parses a JSONB array column into List<String>.
	 * Returns null if the column is NULL in the DB (backward compat for existing
	 * vendor rows created before the ALTER TABLE migration).
	 */
	private List<String> parseJsonbAsList(String columnName, ResultSet rs) {
		try {
			PGobject pgObj = (PGobject) rs.getObject(columnName);
			if (pgObj != null) {
				return mapper.readValue(pgObj.getValue(), new TypeReference<List<String>>() {});
			}
		} catch (IOException | SQLException e) {
			throw new CustomException("PARSING_ERROR", "Failed to parse JSONB column: " + columnName);
		}
		return null;
	}

	private void addWorkOrderToVendor(ResultSet rs, Vendor vendor) throws SQLException {
		String vwoId = rs.getString("vwo_id");

		if (vwoId != null) {
			VendorWorkOrder workOrder = VendorWorkOrder.builder()
					.id(vwoId)
					.name(rs.getString("vwo_name"))
					.tenantId(rs.getString("vwo_tenantid"))
					.vendorId(rs.getString("vwo_vendor_id"))
					.validFrom(rs.getLong("vwo_valid_from"))
					.validTo(rs.getLong("vwo_valid_to"))
					.mobileNumber(rs.getString("vwo_mobileNumber"))
					.alternateNumber(rs.getString("vwo_alternateNumber"))
					.emailId(rs.getString("vwo_emailId"))
					.serviceType(rs.getString("vwo_servicetype"))
					.fileStoreId(rs.getString("wt_file_store_id"))
					.fillingStationId(rs.getString("filling_station_id"))
					.build();

			if (vendor.getVendorWorkOrder().stream().noneMatch(wo -> wo.getId().equals(vwoId))) {
				vendor.getVendorWorkOrder().add(workOrder);
			}
		}
	}

	private void addFillingPointToVendor(ResultSet rs, Vendor vendor) throws SQLException {
		String fpId = rs.getString("fp_id");

		if (fpId == null) return;

		if (vendor.getFillingPoint() == null) {
			vendor.setFillingPoint(new ArrayList<>());
		}

		boolean alreadyAdded = vendor.getFillingPoint()
				.stream()
				.anyMatch(fp -> fp.getId().equals(fpId));

		if (!alreadyAdded) {
			FillingPoint fillingPoint = FillingPoint.builder()
					.id(fpId)
					.fillingPointId(rs.getString("fp_filling_point_id"))
					.tenantId(rs.getString("fp_tenant_id"))
					.fillingPointName(rs.getString("filling_point_name"))
					.emergencyName(rs.getString("emergency_name"))
					.eeName(rs.getString("ee_name"))
					.eeEmail(rs.getString("ee_email"))
					.eeMobile(rs.getString("ee_mobile"))
					.aeName(rs.getString("ae_name"))
					.aeEmail(rs.getString("ae_email"))
					.aeMobile(rs.getString("ae_mobile"))
					.jeName(rs.getString("je_name"))
					.jeEmail(rs.getString("je_email"))
					.jeMobile(rs.getString("je_mobile"))
					.createdBy(rs.getString("fp_createdby"))
					.lastModifiedBy(rs.getString("fp_lastmodifiedby"))
					.createdTime(rs.getLong("fp_createdtime"))
					.lastModifiedTime(rs.getLong("fp_lastmodifiedtime"))
					.build();

			vendor.getFillingPoint().add(fillingPoint);
		}
	}

	private void addVendorAdditionalDetailsToVendor(ResultSet rs, Vendor vendor) throws SQLException {

		if (vendor.getVendorAdditionalDetails() != null) return;

		String vadId = rs.getString("vad_id");
		if (vadId == null) return;

		VendorAdditionalDetails details = new VendorAdditionalDetails();
		details.setVendorAdditionalDetailsId(rs.getString("vad_id"));
		details.setVendorId(rs.getString("vad_vendor_id"));
		details.setTenantId(rs.getString("vad_tenant_id"));
		details.setCode(rs.getString("vad_code"));
		details.setName(rs.getString("vad_name"));
		details.setVendorCompany(rs.getString("vad_vendor_company"));
		details.setVendorCategory(rs.getString("vad_vendor_category"));
		details.setVendorPhone(rs.getString("vad_vendor_phone"));
		details.setVendorEmail(rs.getString("vad_vendor_email"));
		details.setContactPerson(rs.getString("vad_contact_person"));
		details.setVendorMobileNumber(rs.getString("vad_vendor_mobile_number"));
		details.setIfscCode(rs.getString("vad_ifsc_code"));
		details.setBank(rs.getString("vad_bank"));
		details.setBankBranchName(rs.getString("vad_bank_branch_name"));
		details.setMicrNo(rs.getString("vad_micr_no"));
		details.setBankAccountNumber(rs.getString("vad_bank_account_number"));
		details.setNarration(rs.getString("vad_narration"));
		details.setPanNo(rs.getString("vad_pan_no"));
		details.setGstTinNo(rs.getString("vad_gst_tin_no"));
		details.setGstRegisteredState(rs.getString("vad_gst_registered_state"));
		details.setVendorGroup(rs.getString("vad_vendor_group"));
		details.setVendorType(rs.getString("vad_vendor_type"));
		details.setServiceType(rs.getString("vad_service_type"));
		details.setRegistrationNo(rs.getString("vad_registration_no"));

		long registrationDate = rs.getLong("vad_registration_date");
		details.setRegistrationDate(rs.wasNull() ? null : registrationDate);

		details.setStatus(rs.getString("vad_status"));
		details.setActive(rs.getBoolean("vad_active"));
		details.setEpfNo(rs.getString("vad_epf_no"));
		details.setEsiNo(rs.getString("vad_esi_no"));

		vendor.setVendorAdditionalDetails(details);
	}
}