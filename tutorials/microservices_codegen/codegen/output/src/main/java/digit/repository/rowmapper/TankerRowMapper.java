package digit.repository.rowmapper;

import digit.web.models.Tanker;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class TankerRowMapper implements RowMapper<Tanker> {

    @Override
    public Tanker mapRow(ResultSet rs, int rowNum) throws SQLException {

        Tanker tanker = new Tanker();

        tanker.setTankerId(rs.getString("id"));
        tanker.setTankerNumber(rs.getString("tanker_number"));
        tanker.setCapacity(rs.getInt("capacity"));

        return tanker;
    }
}