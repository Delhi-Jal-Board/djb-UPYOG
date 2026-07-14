package digit.web.models;

import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
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
 * ErrorResponse
 */
@Validated
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2026-07-14T11:36:04.741+05:30")

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ErrorResponse   {
        @JsonProperty("code")
        private String code = null;

        @JsonProperty("message")
        private String message = null;

        @JsonProperty("details")
        @Valid
        private List<String> details = null;


        public ErrorResponse addDetailsItem(String detailsItem) {
            if (this.details == null) {
            this.details = new ArrayList<>();
            }
        this.details.add(detailsItem);
        return this;
        }

}

