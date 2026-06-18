package org.egov.vehicle.repository;

import java.util.*;
import java.util.stream.Collectors;

import javax.validation.Valid;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.CustomException;
import org.egov.vehicle.config.VehicleConfiguration;
import org.egov.vehicle.producer.VehicleProducer;
import org.egov.vehicle.repository.querybuilder.QueryBuilder;
import org.egov.vehicle.repository.rowmapper.RowMapper;
import org.egov.vehicle.trip.repository.rowmapper.TripDetailRowMapper;
import org.egov.vehicle.trip.web.model.VehicleTripDetail;
import org.egov.vehicle.trip.web.model.VehicleTripSearchCriteria;
import org.egov.vehicle.util.ErrorConstants;
import org.egov.vehicle.web.model.*;
import org.egov.vehicle.web.model.driver.Driver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SingleColumnRowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Repository
@Slf4j
public class VehicleRepository {

	@Autowired
	private VehicleConfiguration config;

	@Autowired
	private VehicleProducer vehicleProducer;

	@Autowired
	private QueryBuilder queryBuilder;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private RowMapper rowMapper;

	@Autowired
	private TripDetailRowMapper vehicleTripMapper;

	private static final String QUERY_SEARCH_VEHICLE_LOG = " SELECT applicationstatus,count(applicationstatus) FROM eg_vehicle_trip ";

	private static final String QUERY_VEHICLE_TRIP_DETAIL = "SELECT id,tenantid,trip_id,referenceno,referencestatus,additionaldetails,status,itemstarttime, "
			+ "itemendtime, volume from eg_vehicle_trip_detail ";


	private static final String INSERT_DRIVER_HISTORY =
			"INSERT INTO eg_vehicle_driver_history " +
					"(id, vehicle_id, driver_id, status, createdby, createdtime, lastmodifiedby, lastmodifiedtime) " +
					"VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

	public void save(VehicleRequest vehicleRequest) {
		vehicleProducer.push(config.getSaveTopic(), vehicleRequest);
	}

	public void update(VehicleRequest vehicleRequest) {
		vehicleProducer.push(config.getUpdateTopic(), vehicleRequest);
	}

	private static final String UPDATE_DRIVER_MAPPING_INACTIVE =
			"UPDATE eg_vehicle_driver_mapping SET status='INACTIVE' WHERE vehicle_id=? AND status='ACTIVE'";

	private static final String INSERT_DRIVER_MAPPING =
			"INSERT INTO eg_vehicle_driver_mapping(vehicle_id, driver_id, status) " +
					"VALUES(?, ?, ?) " +
					"ON CONFLICT (vehicle_id, driver_id) DO UPDATE SET status = EXCLUDED.status";


	private static final String INSERT_DRIVER_HISTORY_BY_VEHICLE =
			"INSERT INTO eg_vehicle_driver_history " +
					"(id, vehicle_id, driver_id, status, createdby, createdtime, lastmodifiedby, lastmodifiedtime) " +
					"SELECT ?, vehicle_id, driver_id, status, ?, ?, ?, ? " +
					"FROM eg_vehicle_driver_mapping " +
					"WHERE vehicle_id = ?";

	private static final String INSERT_DRIVER_HISTORY_BY_DRIVER =
			"INSERT INTO eg_vehicle_driver_history " +
					"(id, vehicle_id, driver_id, status, createdby, createdtime, lastmodifiedby, lastmodifiedtime) " +
					"SELECT ?, vehicle_id, driver_id, status, ?, ?, ?, ? " +
					"FROM eg_vehicle_driver_mapping " +
					"WHERE driver_id = ?";

	private static final String DELETE_MAPPING_BY_VEHICLE =
			"DELETE FROM eg_vehicle_driver_mapping WHERE vehicle_id = ?";

	private static final String DELETE_MAPPING_BY_DRIVER =
			"DELETE FROM eg_vehicle_driver_mapping WHERE driver_id = ?";

	public void updateDriver(VehicleRequest vehicleRequest) {
		String vehicleId = vehicleRequest.getVehicle().getId();
		String driverId = vehicleRequest.getVehicle().getDriver().getId();
		String status = vehicleRequest.getVehicle().getDriver().getStatus().toString();

				// CHECK DRIVER ALREADY ASSIGNED TO ANOTHER VEHICLE

				Integer driverCount = getDriverMappingCount(driverId, vehicleId);

				if (driverCount > 0) {

				//  Save old mapping of this driver into history
					jdbcTemplate.update(
							INSERT_DRIVER_HISTORY_BY_DRIVER,
							UUID.randomUUID().toString(),
							vehicleRequest.getVehicle().getAuditDetails().getCreatedBy(),
							vehicleRequest.getVehicle().getAuditDetails().getCreatedTime(),
							vehicleRequest.getVehicle().getAuditDetails().getLastModifiedBy(),
							vehicleRequest.getVehicle().getAuditDetails().getLastModifiedTime()
					        ,driverId);

					// Delete old mapping of this driver
					jdbcTemplate.update(DELETE_MAPPING_BY_DRIVER, driverId);
                  }

				// CHECK VEHICLE ALREADY ASSIGNED TO ANOTHER DRIVER

				Integer vehicleCount = getVehicleMappingCount(vehicleId, driverId);

				if (vehicleCount > 0) {

					//  Save old mapping of this vehicle into history
					jdbcTemplate.update(
							INSERT_DRIVER_HISTORY_BY_VEHICLE,
							UUID.randomUUID().toString(),
							vehicleRequest.getVehicle().getAuditDetails().getCreatedBy(),
							vehicleRequest.getVehicle().getAuditDetails().getCreatedTime(),
							vehicleRequest.getVehicle().getAuditDetails().getLastModifiedBy(),
							vehicleRequest.getVehicle().getAuditDetails().getLastModifiedTime(),
							vehicleId
					);
					//  Delete old mapping of this vehicle
					jdbcTemplate.update(DELETE_MAPPING_BY_VEHICLE, vehicleId);
				}

		log.info("Direct DB: inserting driver mapping vehicleId={}, driverId={}, status={}", vehicleId, driverId, status);
		jdbcTemplate.update(INSERT_DRIVER_MAPPING, vehicleId, driverId, status);

	}

	private static final String UPDATE_FILLING_POINT_QUERY =
			"UPDATE eg_vehicle SET filling_point_id=? WHERE id=?";

	public void updateFillingPoint(VehicleRequest vehicleRequest) {
		String fillingStationId = vehicleRequest.getVehicle()
				.getFillingPoint().getId();
		String vehicleId = vehicleRequest.getVehicle().getId();

		int rows = jdbcTemplate.update(UPDATE_FILLING_POINT_QUERY,
				fillingStationId, vehicleId);

		log.info("Updated {} row(s)", rows);
	}

	public VehicleResponse getVehicleData(@Valid VehicleSearchCriteria criteria) {

		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStmtList);
		List<Vehicle> vehicles = jdbcTemplate.query(query, preparedStmtList.toArray(), rowMapper);
		return VehicleResponse.builder().vehicle(vehicles).totalCount(Integer.valueOf(rowMapper.getFullCount()))
				.build();
	}

	public Integer getVehicleCount(VehicleRequest vehicleRequest, String status) {
		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.vehicleExistsQuery(vehicleRequest, preparedStmtList);
		preparedStmtList.add(status);
		Integer count = null;
		try {
			count = jdbcTemplate.queryForObject(query, preparedStmtList.toArray(), Integer.class);
		} catch (Exception e) {
			log.info("Exception getVehicleCount: " + e);
		}
		return count;
	}

	public Integer getDriverMappingCount(String driverId, String vehicleId) {

		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getDriverMappingCountQuery(driverId, vehicleId, preparedStmtList);
		Integer count = null;
		try {
			count = jdbcTemplate.queryForObject(query, preparedStmtList.toArray(), Integer.class);

		} catch (Exception e) {
			log.info("Exception getDriverMappingCount: " + e);
		}
		return count;
	}

	public Integer getVehicleMappingCount(String vehicleId, String driverId) {

		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getVehicleMappingCountQuery(vehicleId, driverId, preparedStmtList);
		Integer count = null;

		try {
			count = jdbcTemplate.queryForObject(query, preparedStmtList.toArray(), Integer.class);
		} catch (Exception e) {
			log.info("Exception getVehicleMappingCount: " + e);
		}
		return count;
	}

	public List<String> fetchVehicleIds(@Valid VehicleSearchCriteria criteria) {

		List<Object> preparedStmtList = new ArrayList<>();
		preparedStmtList.add(criteria.getOffset());
		preparedStmtList.add(criteria.getLimit());

		return jdbcTemplate.query("SELECT id from eg_vehicle ORDER BY createdtime offset " + " ? " + "limit ? ",
				preparedStmtList.toArray(), new SingleColumnRowMapper<>(String.class));
	}

	public List<String> fetchVehicleIdsWithNoVendor(@Valid VehicleSearchCriteria criteria) {

		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getVehicleIdsWithNoVendorQuery(criteria, preparedStmtList);
		return jdbcTemplate.query(query, preparedStmtList.toArray(), new SingleColumnRowMapper<>(String.class));
	}




	public List<String> fetchVehicleIdsWithNoDriver(@Valid VehicleSearchCriteria criteria) {

		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getVehicleIdsWithNoDriverQuery(criteria, preparedStmtList);
		return jdbcTemplate.query(query, preparedStmtList.toArray(), new SingleColumnRowMapper<>(String.class));
	}


	public List<Vehicle> getVehiclePlainSearch(VehicleSearchCriteria criteria) {
		if (criteria.getIds() == null || criteria.getIds().isEmpty())
			throw new CustomException("PLAIN_SEARCH_ERROR", "Search only allowed by ids!");

		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getVehicleLikeQuery(criteria, preparedStmtList);
		log.info("Query: " + query);
		log.info("PS: " + preparedStmtList);
		return jdbcTemplate.query(query, preparedStmtList.toArray(), rowMapper);
	}

	public List<Map<String, Object>> fetchStatusCount(VehicleSearchCriteria criteria) {
		List<Object> preparedStmtList = new ArrayList<>();
		String query = getSearchQuery(criteria, preparedStmtList);
		return jdbcTemplate.queryForList(query, preparedStmtList.toArray());
	}

	public List<VehicleTripDetail> fetchVehicleTripDetailsByReferenceNo(
			VehicleTripSearchCriteria vehicleTripSearchCriteria) {
		StringBuilder builder = new StringBuilder(QUERY_VEHICLE_TRIP_DETAIL);
		List<Object> preparedStmtList = new ArrayList<>();
		if (!CollectionUtils.isEmpty(vehicleTripSearchCriteria.getRefernceNos())) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append(" referenceno IN (").append(createQuery(vehicleTripSearchCriteria.getRefernceNos()))
					.append(")");
			addToPreparedStatement(preparedStmtList, vehicleTripSearchCriteria.getRefernceNos());
		}
		List<VehicleTripDetail> vehicleTrips = new ArrayList();
		try {
			vehicleTrips = jdbcTemplate.query(builder.toString(), preparedStmtList.toArray(), vehicleTripMapper);
		} catch (IllegalArgumentException e) {
			throw new CustomException(ErrorConstants.PARSING_ERROR, "Failed to parse response of VehicleTripIntance");
		}
		return vehicleTrips;
	}

	private String getSearchQuery(VehicleSearchCriteria criteria, List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder(QUERY_SEARCH_VEHICLE_LOG);

		if (criteria.getTenantId() != null) {
			if (criteria.getTenantId().split("\\.").length == 1) {
				addClauseIfRequired(preparedStmtList, builder);
				builder.append(" tenantid like ?");
				preparedStmtList.add('%' + criteria.getTenantId() + '%');
			} else {
				addClauseIfRequired(preparedStmtList, builder);
				builder.append(" tenantid=? ");
				preparedStmtList.add(criteria.getTenantId());
			}
		}

		List<String> appStates = criteria.getApplicationStatus();

		if (!CollectionUtils.isEmpty(appStates)) {
			addClauseIfRequired(preparedStmtList, builder);
			builder.append(" applicationstatus IN (").append(createQuery(appStates)).append(")");
			addToPreparedStatement(preparedStmtList, appStates);
		}

		builder.append(" group by applicationstatus ");

		return builder.toString();

	}

	private void addToPreparedStatement(List<Object> preparedStmtList, List<String> ids) {
		ids.forEach(id -> {
			preparedStmtList.add(id);
		});
	}

	private Object createQuery(List<String> ids) {
		StringBuilder builder = new StringBuilder();
		int length = ids.size();
		for (int i = 0; i < length; i++) {
			builder.append(" ?");
			if (i != length - 1)
				builder.append(",");
		}
		return builder.toString();
	}

	private void addClauseIfRequired(List<Object> values, StringBuilder queryString) {
		if (values.isEmpty())
			queryString.append(" WHERE ");
		else {
			queryString.append(" AND");
		}
	}

	private static final String QUERY_DRIVER_MAPPING =
			"SELECT vdm.vehicle_id, vdm.driver_id, " +
					" d.name, d.tenantid, d.additionaldetails, d.owner_id, " +
					" d.description, d.status, d.licensenumber, " +
					" d.createdby, d.lastmodifiedby, d.createdtime, d.lastmodifiedtime " +
					" FROM eg_vehicle_driver_mapping vdm " +
					" INNER JOIN eg_driver d ON vdm.driver_id = d.id " +
					" WHERE vdm.vehicle_id IN (%s) AND vdm.status = 'ACTIVE' ";
	// REPLACE old fetchDriverMappings() with this
	public Map<String, Driver> fetchDriverMappings(List<String> vehicleIds) {
		Map<String, Driver> vehicleDriverMap = new HashMap<>();

		if (CollectionUtils.isEmpty(vehicleIds)) {
			return vehicleDriverMap;
		}

		String inClause = vehicleIds.stream()
				.map(id -> "?")
				.collect(Collectors.joining(", "));

		String query = String.format(QUERY_DRIVER_MAPPING, inClause);

		try {
			jdbcTemplate.query(query, vehicleIds.toArray(), rs -> {
				String vehicleId = rs.getString("vehicle_id");

				// Build AuditDetails for driver
				AuditDetails auditDetails = AuditDetails.builder()
						.createdBy(rs.getString("createdby"))
						.lastModifiedBy(rs.getString("lastmodifiedby"))
						.createdTime(rs.getLong("createdtime"))
						.lastModifiedTime(rs.getLong("lastmodifiedtime"))
						.build();

				// Build full Driver object
				Driver driver = Driver.builder()
						.id(rs.getString("driver_id"))
						.name(rs.getString("name"))
						.tenantId(rs.getString("tenantid"))
						.ownerId(rs.getString("owner_id"))
						.description(rs.getString("description"))
						.licenseNumber(rs.getString("licensenumber"))
						.status(Driver.StatusEnum.fromValue(rs.getString("status")))
						.auditDetails(auditDetails)
						.build();

				// If vehicle has multiple drivers, last row wins
				// You can change this logic to keep first if needed
				vehicleDriverMap.put(vehicleId, driver);
			});
		} catch (Exception e) {
			log.error("Exception while fetching driver mappings: ", e);
		}

		return vehicleDriverMap;
	}


	public List<String> fetchVehicleIdsByVendorOwner(String ownerUuid) {

		String query =
				"SELECT ev.vechile_id " +
						"FROM eg_vendor_vehicle ev " +
						"JOIN eg_vendor v ON ev.vendor_id = v.id " +
						"WHERE v.owner_id = ? AND ev.vendorvehiclestatus = 'ACTIVE'";

		return jdbcTemplate.query(query, new Object[]{ownerUuid},
				new SingleColumnRowMapper<>(String.class));
	}

	public boolean vendorVehicleMappingExists(String vendorId) {
		String query =
				"SELECT COUNT(*) FROM eg_vendor_vehicle " +
						"WHERE vendor_id = ? " +
						"AND vendorvehiclestatus = 'ACTIVE'";
		Integer count =
				jdbcTemplate.queryForObject(query, Integer.class, vendorId);
		return count != null && count > 0;
	}

	public String getVendorIdByOwnerId(String ownerId) {

		String query =
				"SELECT id FROM eg_vendor WHERE owner_id = ? LIMIT 1";
		List<String> vendorIds =
				jdbcTemplate.queryForList(query, String.class, ownerId);
		return CollectionUtils.isEmpty(vendorIds)
				? null
				: vendorIds.get(0);
	}

}