package digit.web.models;

import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import digit.web.models.Tanker;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.util.ArrayList;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import javax.validation.Valid;
import javax.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;

/**
 * TankerSearchResponse
 */
@Validated
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2026-07-14T11:36:04.741+05:30")

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TankerSearchResponse   {
        @JsonProperty("tankers")
        @Valid
        private List<Tanker> tankers = null;

        @JsonProperty("totalCount")
        private Integer totalCount = null;

        @JsonProperty("status")
        private String status = null;


        public TankerSearchResponse addTankersItem(Tanker tankersItem) {
            if (this.tankers == null) {
            this.tankers = new ArrayList<>();
            }
        this.tankers.add(tankersItem);
        return this;
        }

}

