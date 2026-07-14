package digit.web.controllers;


import digit.web.models.ErrorResponse;
import digit.web.models.TankerRequest;
import digit.web.models.TankerResponse;
import digit.web.models.TankerSearchRequest;
import digit.web.models.TankerSearchResponse;
    import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.annotations.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestMapping;
import java.io.IOException;
import java.util.*;

    import javax.validation.constraints.*;
    import javax.validation.Valid;
    import javax.servlet.http.HttpServletRequest;
        import java.util.Optional;
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2026-07-14T11:36:04.741+05:30")

@Controller
    @RequestMapping("/water-tanker-service")
    public class V1ApiController{

        private final ObjectMapper objectMapper;

        private final HttpServletRequest request;

        @Autowired
        public V1ApiController(ObjectMapper objectMapper, HttpServletRequest request) {
        this.objectMapper = objectMapper;
        this.request = request;
        }

                @RequestMapping(value="/v1/tanker/_create", method = RequestMethod.POST)
                public ResponseEntity<TankerResponse> createTanker(@ApiParam(value = "" ,required=true) @RequestHeader(value="tenantId", required=true) String tenantId,@ApiParam(value = "" ,required=true) @RequestHeader(value="X-Request-ID", required=true) String xRequestID,@ApiParam(value = "" ,required=true )  @Valid @RequestBody TankerRequest body) {
                        String accept = request.getHeader("Accept");
                            if (accept != null && accept.contains("application/json")) {
                            try {
                            return new ResponseEntity<TankerResponse>(objectMapper.readValue("{  \"responseInfo\" : {    \"ver\" : \"1.0\",    \"authToken\" : \"authToken\",    \"action\" : \"action\",    \"msgId\" : \"msgId\",    \"apiId\" : \"water-tanker-service\",    \"ts\" : 0  },  \"message\" : \"message\",  \"tankerId\" : \"tankerId\",  \"status\" : \"status\"}", TankerResponse.class), HttpStatus.NOT_IMPLEMENTED);
                            } catch (IOException e) {
                            return new ResponseEntity<TankerResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                            }

                        return new ResponseEntity<TankerResponse>(HttpStatus.NOT_IMPLEMENTED);
                }

                @RequestMapping(value="/v1/tanker/_search", method = RequestMethod.POST)
                public ResponseEntity<TankerSearchResponse> searchTanker(@ApiParam(value = "" ,required=true) @RequestHeader(value="tenantId", required=true) String tenantId,@ApiParam(value = "" ,required=true )  @Valid @RequestBody TankerSearchRequest body) {
                        String accept = request.getHeader("Accept");
                            if (accept != null && accept.contains("application/json")) {
                            try {
                            return new ResponseEntity<TankerSearchResponse>(objectMapper.readValue("{  \"tankers\" : [ {    \"driver\" : {      \"driverId\" : \"driverId\",      \"mobileNumber\" : \"9876543210\",      \"name\" : \"name\"    },    \"auditDetails\" : {      \"lastModifiedTime\" : 1,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 6    },    \"tankerNumber\" : \"DL01AB1234\",    \"tankerId\" : \"WT-10001\",    \"capacity\" : 5000,    \"vehicle\" : {      \"registrationNumber\" : \"registrationNumber\",      \"vehicleId\" : \"vehicleId\",      \"vehicleType\" : \"vehicleType\",      \"capacity\" : 0    },    \"status\" : \"ACTIVE\"  }, {    \"driver\" : {      \"driverId\" : \"driverId\",      \"mobileNumber\" : \"9876543210\",      \"name\" : \"name\"    },    \"auditDetails\" : {      \"lastModifiedTime\" : 1,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 6    },    \"tankerNumber\" : \"DL01AB1234\",    \"tankerId\" : \"WT-10001\",    \"capacity\" : 5000,    \"vehicle\" : {      \"registrationNumber\" : \"registrationNumber\",      \"vehicleId\" : \"vehicleId\",      \"vehicleType\" : \"vehicleType\",      \"capacity\" : 0    },    \"status\" : \"ACTIVE\"  } ],  \"totalCount\" : 0,  \"status\" : \"status\"}", TankerSearchResponse.class), HttpStatus.NOT_IMPLEMENTED);
                            } catch (IOException e) {
                            return new ResponseEntity<TankerSearchResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                            }

                        return new ResponseEntity<TankerSearchResponse>(HttpStatus.NOT_IMPLEMENTED);
                }

                @RequestMapping(value="/v1/tanker/_update", method = RequestMethod.POST)
                public ResponseEntity<TankerResponse> updateTanker(@ApiParam(value = "" ,required=true) @RequestHeader(value="tenantId", required=true) String tenantId,@ApiParam(value = "" ,required=true )  @Valid @RequestBody TankerRequest body) {
                        String accept = request.getHeader("Accept");
                            if (accept != null && accept.contains("application/json")) {
                            try {
                            return new ResponseEntity<TankerResponse>(objectMapper.readValue("{  \"responseInfo\" : {    \"ver\" : \"1.0\",    \"authToken\" : \"authToken\",    \"action\" : \"action\",    \"msgId\" : \"msgId\",    \"apiId\" : \"water-tanker-service\",    \"ts\" : 0  },  \"message\" : \"message\",  \"tankerId\" : \"tankerId\",  \"status\" : \"status\"}", TankerResponse.class), HttpStatus.NOT_IMPLEMENTED);
                            } catch (IOException e) {
                            return new ResponseEntity<TankerResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                            }

                        return new ResponseEntity<TankerResponse>(HttpStatus.NOT_IMPLEMENTED);
                }

        }
