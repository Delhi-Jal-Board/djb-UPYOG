package digit.repository.querybuilder;

import digit.web.models.TankerSearchRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.List;

/**
 * Query builder class for constructing SQL queries for Water Tanker.
 * This class dynamically builds SQL queries based on the search criteria provided.
 */
@Component
public class TankerQueryBuilder {

    private static final String BASE_TANKER_QUERY =
            "SELECT WT.id AS wtid, " +
                    "WT.tankerNumber AS wttankernumber, " +
                    "WT.capacity AS wtcapacity, " +
                    "WT.status AS wtstatus, " +
                    "DR.id AS driverid, " +
                    "DR.name AS drivername, " +
                    "VH.id AS vehicleid, " +
                    "VH.registrationNumber AS vehicleregistrationnumber " +
                    "FROM EG_WT_TANKER WT " +
                    "LEFT JOIN EG_DRIVER DR ON WT.driverId = DR.id " +
                    "LEFT JOIN EG_VEHICLE VH ON WT.vehicleId = VH.id ";


    public String getTankerSearchQuery(TankerSearchRequest criteria,
                                       List<Object> preparedStmtList) {

        StringBuilder query = new StringBuilder(BASE_TANKER_QUERY);

        if (!ObjectUtils.isEmpty(criteria.getTankerNumber())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" WT.tankerNumber = ? ");
            preparedStmtList.add(criteria.getTankerNumber());
        }

        if (!ObjectUtils.isEmpty(criteria.getDriverName())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" DR.name = ? ");
            preparedStmtList.add(criteria.getDriverName());
        }

        if (!ObjectUtils.isEmpty(criteria.getStatus())) {
            addClauseIfRequired(query, preparedStmtList);
            query.append(" WT.status = ? ");
            preparedStmtList.add(criteria.getStatus());
        }

        query.append(" ORDER BY WT.createdTime DESC ");

        if (criteria.getPagination() != null) {

            query.append(" LIMIT ? OFFSET ? ");

            preparedStmtList.add(criteria.getPagination().getLimit());

            preparedStmtList.add(criteria.getPagination().getOffset());
        }

        return query.toString();
    }

    private void addClauseIfRequired(StringBuilder query,
                                     List<Object> preparedStmtList) {

        if (preparedStmtList.isEmpty()) {
            query.append(" WHERE ");
        } else {
            query.append(" AND ");
        }
    }

}