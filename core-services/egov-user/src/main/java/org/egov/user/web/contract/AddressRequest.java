package org.egov.user.web.contract;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.egov.common.contract.request.RequestInfo;
import org.egov.user.domain.model.Address;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class AddressRequest {

    @JsonProperty("requestInfo")
    @JsonAlias({"RequestInfo", "requestInfo"})
    RequestInfo requestInfo;

    @JsonProperty("address")
    Address address;

    @JsonProperty("userUuid")
    String userUuid;

    @JsonProperty("addressId")
    String addressId;

}
