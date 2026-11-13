package org.egov.waterconnection.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.egov.waterconnection.config.WSConfiguration;
import org.egov.waterconnection.constants.WCConstants;
import org.egov.waterconnection.repository.ServiceRequestRepository;
import org.egov.waterconnection.util.EncryptionDecryptionUtil;
import org.egov.waterconnection.util.NotificationUtil;
import org.egov.waterconnection.util.UnmaskingUtil;
import org.egov.waterconnection.util.WaterServicesUtil;
import org.egov.waterconnection.validator.ValidateProperty;
import org.egov.waterconnection.web.models.*;
import org.egov.waterconnection.web.models.collection.PaymentResponse;
import org.egov.waterconnection.web.models.users.UserDetailResponse;
import org.egov.waterconnection.web.models.users.UserSearchRequest;
import org.egov.waterconnection.web.models.workflow.BusinessService;
import org.egov.waterconnection.web.models.workflow.ProcessInstance;
import org.egov.waterconnection.web.models.workflow.State;
import org.egov.waterconnection.workflow.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.egov.common.utils.MultiStateInstanceUtil;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.Map.Entry;
import java.util.stream.Collectors;

import static org.egov.waterconnection.constants.WCConstants.*;

import static org.egov.waterconnection.constants.WCConstants.*;

@Service
@Slf4j
public class WorkflowNotificationService {

    @Autowired
    private NotificationUtil notificationUtil;

    @Autowired
    private WSConfiguration config;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private WaterServicesUtil waterServiceUtil;

    @Autowired
    private ValidateProperty validateProperty;

    @Autowired
    private UserService userService;

    @Autowired
    private UnmaskingUtil unmaskingUtil;

    @Autowired
    private EncryptionDecryptionUtil encryptionDecryptionUtil;

    @Autowired
    private MultiStateInstanceUtil centralInstanceUtil;

    @Autowired
    private PdfFileStoreService pdfFileStoreService;

    String tenantIdReplacer = "$tenantId";
    String urlReplacer = "url";
    String requestInfoReplacer = "RequestInfo";
    String WaterConnectionReplacer = "WaterConnection";
    String fileStoreIdReplacer = "$fileStoreIds";
    String totalAmount= "totalAmount";
    String applicationFee = "applicationFee";
    String serviceFee = "serviceFee";
    String tax = "tax";
    String applicationNumberReplacer = "$applicationNumber";
    String consumerCodeReplacer = "$consumerCode";
    String connectionNoReplacer = "$connectionNumber";
    String mobileNoReplacer = "$mobileNo";
    String applicationKey = "$applicationkey";
    String propertyKey = "property";
    String businessService = "WS.ONE_TIME_FEE";
    String tenantName = "tenantName";

    /**
     *
     * @param request record is bill response.
     * @param topic topic is bill generation topic for water.
     */
    public void process(WaterConnectionRequest request, String topic) {
        try {
        	String tenantId = request.getWaterConnection().getTenantId();
        	log.info("In process of consumer to generate notifications");
            String applicationStatus = request.getWaterConnection().getApplicationStatus();
            List<String> configuredChannelNames=new ArrayList<String>();
			if(request.getWaterConnection().getApplicationType().equalsIgnoreCase(WCConstants.WATER_RECONNECTION) || request.getWaterConnection().getApplicationType().equalsIgnoreCase(WCConstants.DISCONNECT_WATER_CONNECTION))
            	configuredChannelNames=  notificationUtil.fetchChannelList(request.getRequestInfo(), request.getWaterConnection().getTenantId(), "WS.CREATE", request.getWaterConnection().getProcessInstance().getAction());
            else
                configuredChannelNames =  notificationUtil.fetchChannelList(request.getRequestInfo(), request.getWaterConnection().getTenantId(), WATER_SERVICE_BUSINESS_ID, request.getWaterConnection().getProcessInstance().getAction());
            log.info("configuredChannelNames for request Type " + request.getWaterConnection().getApplicationType() + " is :: "  + configuredChannelNames);
			User userInfoCopy = request.getRequestInfo().getUserInfo();
            User userInfo = notificationUtil.getInternalMicroserviceUser(request.getWaterConnection().getTenantId());
            request.getRequestInfo().setUserInfo(userInfo);

            Property property = validateProperty.getOrValidateProperty(request);

            request.getRequestInfo().setUserInfo(userInfoCopy);
            if(configuredChannelNames.contains(CHANNEL_NAME_EVENT)){
                if (config.getIsUserEventsNotificationEnabled() != null && config.getIsUserEventsNotificationEnabled()) {
                    EventRequest eventRequest = getEventRequest(request, topic, property, applicationStatus);
                    if (eventRequest != null) {
                        notificationUtil.sendEventNotification(eventRequest, tenantId);
                    }
                }}
            if(configuredChannelNames.contains(CHANNEL_NAME_SMS)){
                if (config.getIsSMSEnabled() != null && config.getIsSMSEnabled()) {
                    List<SMSRequest> smsRequests = getSmsRequest(request, topic, property, applicationStatus);
                    if (!CollectionUtils.isEmpty(smsRequests)) {
                        notificationUtil.sendSMS(smsRequests, tenantId);
                    }
                }}
            if(configuredChannelNames.contains(CHANNEL_NAME_EMAIL)){
                if (config.getIsEmailNotificationEnabled() != null && config.getIsEmailNotificationEnabled()) {
                    List<EmailRequest> emailRequests = getEmailRequest(request, topic, property, applicationStatus);
                    if (!CollectionUtils.isEmpty(emailRequests)) {
                        notificationUtil.sendEmail(emailRequests, tenantId);
                    }
                }}

            if (config.getWhatsappNotificationsEnabled() != null && config.getWhatsappNotificationsEnabled()) {
                try {
                    processWhatsAppNotifications(request, property, tenantId);
                } catch (Exception e) {
                    log.error("Error occurred while processing WhatsApp notification for application: " 
                            + (request.getWaterConnection() != null ? request.getWaterConnection().getApplicationNo() : ""), e);
                }
            }
        } catch (Exception ex) {
            log.error("Error occured while processing the record from topic : " + topic, ex);
        }

    }

    /**
     *
     * @param request Water Connection Request
     * @param topic Topic Name
     * @param property Property Object
     * @param applicationStatus Application Status
     * @return EventRequest Object
     */
    private EventRequest getEventRequest(WaterConnectionRequest request, String topic, Property property, String applicationStatus) {
        String localizationMessage = notificationUtil
                .getLocalizationMessages(property.getTenantId(), request.getRequestInfo());
        ProcessInstance workflow = request.getWaterConnection().getProcessInstance();

        int reqType = WCConstants.UPDATE_APPLICATION;
        if ((!workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION))
                && waterServiceUtil.isModifyConnectionRequestForNotification(request)) {
            reqType = WCConstants.MODIFY_CONNECTION;
        }
        if ((!workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION))
                && waterServiceUtil.isMutationConnectionRequest(request)) {
            reqType = WCConstants.MUTATION_CONNECTION;
        }
        if((!workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION)) &&
            (!workflow.getAction().equalsIgnoreCase(APPROVE_CONNECTION)) &&
                waterServiceUtil.isDisconnectConnectionRequest(request))
        {
            reqType = DISCONNECT_CONNECTION;
        }
        
        if(workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION) &&
                    waterServiceUtil.isReconnectConnectionRequest(request))
            {
                reqType = RECONNECTION ;
            }

        String message = notificationUtil.getCustomizedMsgForInApp(workflow.getAction(), applicationStatus,
                localizationMessage, reqType);
        if(workflow.getAction().equalsIgnoreCase(APPROVE_DISCONNECTION_CONST) && workflow.getComment()!=null
                && workflow.getComment().contains(WORKFLOW_NO_PAYMENT_CODE))
        {
            message = notificationUtil.getCustomizedMsgForInApp(workflow.getAction(), PENDING_FOR_DISCONNECTION_EXECUTION_STATUS_CODE,
                    localizationMessage, reqType);
        }
        if(workflow.getAction().equalsIgnoreCase(ACTION_PAY) && workflow.getComment()!=null
                && workflow.getComment().contains(WORKFLOW_NO_PAYMENT_CODE))
        {
           log.info("Skipping for action status -> "+workflow.getAction().equalsIgnoreCase(ACTION_PAY)+"_"+request.getWaterConnection().getApplicationStatus()
                   +" because -> "+workflow.getComment());
           return null;
        }

        if (message == null) {
            log.info("No message Found For Topic : " + topic);
            return null;
        }

        Map<String, String> mobileNumbersAndNames = new HashMap<>();
        Map<String, String> mapOfPhoneNoAndUUIDs = new HashMap<>();

        Set<String> ownersMobileNumbers = new HashSet<>();
        //Send the notification to all owners
        property.getOwners().forEach(owner -> {
            if (owner.getMobileNumber() != null)
                ownersMobileNumbers.add(owner.getMobileNumber());
        });

        //send the notification to the connection holders
        if (!CollectionUtils.isEmpty(request.getWaterConnection().getConnectionHolders())) {
            request.getWaterConnection().getConnectionHolders().forEach(holder -> {
                if (!StringUtils.isEmpty(holder.getMobileNumber())) {
                    ownersMobileNumbers.add(holder.getMobileNumber());
                }
            });
        }

        for (String mobileNumber : ownersMobileNumbers) {
            UserDetailResponse userDetailResponse = fetchUserByUsername(mobileNumber, request.getRequestInfo(), request.getWaterConnection().getTenantId());
            if (!CollectionUtils.isEmpty(userDetailResponse.getUser())) {
                OwnerInfo user = userDetailResponse.getUser().get(0);
                String name = user.getName();
                if (StringUtils.isEmpty(name) && !CollectionUtils.isEmpty(request.getWaterConnection().getConnectionHolders())) {
                    name = request.getWaterConnection().getConnectionHolders().get(0).getName();
                }
                mobileNumbersAndNames.put(user.getMobileNumber(), name);
                mapOfPhoneNoAndUUIDs.put(user.getMobileNumber(), user.getUuid());
            } else {
                log.info("No User for mobile {} skipping event", mobileNumber);
            }
        }

        //Send the notification to applicant
        if (!StringUtils.isEmpty(request.getRequestInfo().getUserInfo().getMobileNumber())) {
            mobileNumbersAndNames.put(request.getRequestInfo().getUserInfo().getMobileNumber(), request.getRequestInfo().getUserInfo().getName());
            mapOfPhoneNoAndUUIDs.put(request.getRequestInfo().getUserInfo().getMobileNumber(), request.getRequestInfo().getUserInfo().getUuid());
        }


        Map<String, String> mobileNumberAndMessage = getMessageForMobileNumber(mobileNumbersAndNames, request,
                message, property);
        if (message.contains("{receipt download link}"))
            mobileNumberAndMessage = setRecepitDownloadLink(mobileNumberAndMessage, request, message, property);
        Set<String> mobileNumbers = mobileNumberAndMessage.keySet().stream().collect(Collectors.toSet());

        if (CollectionUtils.isEmpty(mapOfPhoneNoAndUUIDs.keySet())) {
            log.info("UUID search failed here !");
        }
        List<Event> events = new ArrayList<>();
        for (String mobile : mobileNumbers) {
            if (null == mapOfPhoneNoAndUUIDs.get(mobile) || null == mobileNumberAndMessage.get(mobile)) {
                log.error("No UUID/SMS for mobile {} skipping event", mobile);
                continue;
            }
            List<String> toUsers = new ArrayList<>();
            toUsers.add(mapOfPhoneNoAndUUIDs.get(mobile));
            Recepient recepient = Recepient.builder().toUsers(toUsers).toRoles(null).build();
            // List<String> payTriggerList =
            // Arrays.asList(config.getPayTriggers().split("[,]"));

            Action action = getActionForEventNotification(mobileNumberAndMessage, mobile, request, property);
            events.add(Event.builder().tenantId(property.getTenantId())
                    .description(mobileNumberAndMessage.get(mobile)).eventType(WCConstants.USREVENTS_EVENT_TYPE)
                    .name(WCConstants.USREVENTS_EVENT_NAME).postedBy(WCConstants.USREVENTS_EVENT_POSTEDBY)
                    .source(Source.WEBAPP).recepient(recepient).eventDetails(null).actions(action).build());
        }
        if (!CollectionUtils.isEmpty(events)) {
            return EventRequest.builder().requestInfo(request.getRequestInfo()).events(events).build();
        } else {
            return null;
        }
    }

    /**
     *
     * @param mobileNumberAndMessage List of Mobile Numbers and messages
     * @param mobileNumber MobileNumber
     * @param connectionRequest Connection Request
     * @param property Property
     * @return return action link
     */
    public Action getActionForEventNotification(Map<String, String> mobileNumberAndMessage,
                                                String mobileNumber, WaterConnectionRequest connectionRequest, Property property) {
        String messageTemplate = mobileNumberAndMessage.get(mobileNumber);
        List<ActionItem> items = new ArrayList<>();
        if (messageTemplate.contains("{Action Button}")) {
            String code = StringUtils.substringBetween(messageTemplate, "{Action Button}", "{/Action Button}");
            messageTemplate = messageTemplate.replace("{Action Button}", "");
            messageTemplate = messageTemplate.replace("{/Action Button}", "");
            messageTemplate = messageTemplate.replace(code, "");
            String actionLink = "";
            if (code.equalsIgnoreCase("Download Application")) {
                actionLink = config.getNotificationUrl() + config.getViewHistoryLink();
                actionLink = actionLink.replace(applicationNumberReplacer, connectionRequest.getWaterConnection().getApplicationNo());
            }
            if (code.equalsIgnoreCase("PAY NOW")||code.equalsIgnoreCase("Pay Dues")) {
                actionLink = config.getNotificationUrl() + config.getViewHistoryLink();
                actionLink = actionLink.replace(applicationNumberReplacer, connectionRequest.getWaterConnection().getApplicationNo());
            }
            if (code.equalsIgnoreCase("DOWNLOAD RECEIPT")) {
                actionLink = config.getNotificationUrl() + config.getMyPaymentsLink();
            }
            if (code.equalsIgnoreCase("View History Link")) {
                actionLink = config.getNotificationUrl() + config.getViewHistoryLink();
                actionLink = actionLink.replace(mobileNoReplacer, mobileNumber);
                actionLink = actionLink.replace(applicationNumberReplacer, connectionRequest.getWaterConnection().getApplicationNo());
                actionLink = actionLink.replace(tenantIdReplacer, property.getTenantId());
            }
            if (code.equalsIgnoreCase("Connection Detail Page")) {
                actionLink = config.getNotificationUrl() + config.getConnectionDetailsLink();
                actionLink = actionLink.replace(applicationNumberReplacer, connectionRequest.getWaterConnection().getApplicationNo());
            }
            ActionItem item = ActionItem.builder().actionUrl(actionLink).code(code).build();
            items.add(item);
            mobileNumberAndMessage.replace(mobileNumber, messageTemplate);
        }
        return Action.builder().actionUrls(items).build();
    }

    /**
     *
     * @param waterConnectionRequest Water Connection Request
     * @param topic Topic Name
     * @param property Property Object
     * @param applicationStatus Application Status
     * @return Returns list of SMSRequest
     */
    private List<SMSRequest> getSmsRequest(WaterConnectionRequest waterConnectionRequest, String topic,
                                           Property property, String applicationStatus) {
        String localizationMessage = notificationUtil.getLocalizationMessages(property.getTenantId(),
                waterConnectionRequest.getRequestInfo());
        ProcessInstance workflow = waterConnectionRequest.getWaterConnection().getProcessInstance();

        int reqType = WCConstants.UPDATE_APPLICATION;
        if ((!workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION))
                && waterServiceUtil.isModifyConnectionRequestForNotification(waterConnectionRequest)) {
            reqType = WCConstants.MODIFY_CONNECTION;
        }
        if ((!workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION))
                && waterServiceUtil.isMutationConnectionRequest(waterConnectionRequest)) {
            reqType = WCConstants.MUTATION_CONNECTION;
        }
        if((!workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION)) &&
                (!workflow.getAction().equalsIgnoreCase(APPROVE_CONNECTION)) &&
                waterServiceUtil.isDisconnectConnectionRequest(waterConnectionRequest))
        {
            reqType = DISCONNECT_CONNECTION;
        }

        if((workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION)) &&
        		waterServiceUtil.isReconnectConnectionRequest(waterConnectionRequest))
        {
        	reqType = RECONNECTION;
        }
        
        String message = notificationUtil.getCustomizedMsgForSMS(
                workflow.getAction(), applicationStatus,
                localizationMessage, reqType);
        if(workflow.getAction().equalsIgnoreCase(APPROVE_DISCONNECTION_CONST) && workflow.getComment()!=null
                && workflow.getComment().contains(WORKFLOW_NO_PAYMENT_CODE))
        {
            message = notificationUtil.getCustomizedMsgForSMS(workflow.getAction(), PENDING_FOR_DISCONNECTION_EXECUTION_STATUS_CODE,
                    localizationMessage, reqType);
        }
        if(workflow.getAction().equalsIgnoreCase(ACTION_PAY) && workflow.getComment()!=null
                && workflow.getComment().contains(WORKFLOW_NO_PAYMENT_CODE))
        {
            log.info("Skipping for action status -> "+workflow.getAction().equalsIgnoreCase(ACTION_PAY)+"_"+waterConnectionRequest.getWaterConnection().getApplicationStatus()
                    +" because -> "+workflow.getComment());
            return Collections.emptyList();
        }
        if (message == null) {
            log.info("No message Found For Topic : " + topic);
            return Collections.emptyList();
        }
        log.info("SMS body is "+message);

           //Send the notification to all owners
            Map<String, String> mobileNumbersAndNames = new HashMap<>();
            property.getOwners().forEach(owner -> {
                if (owner.getMobileNumber() != null)
                {
                    mobileNumbersAndNames.put(owner.getMobileNumber(),owner.getName());
                }
            });

            //send the notification to the connection holders
            if (!CollectionUtils.isEmpty(waterConnectionRequest.getWaterConnection().getConnectionHolders())) {
                waterConnectionRequest.getWaterConnection().getConnectionHolders().forEach(holder -> {
                    if (!StringUtils.isEmpty(holder.getMobileNumber())) {
                        mobileNumbersAndNames.put(holder.getMobileNumber(),holder.getName());
                    }
                });
            }

            //Send the notification to applicant
            if(!StringUtils.isEmpty(waterConnectionRequest.getRequestInfo().getUserInfo().getMobileNumber()))
            {
                mobileNumbersAndNames.put(waterConnectionRequest.getRequestInfo().getUserInfo().getMobileNumber(), waterConnectionRequest.getRequestInfo().getUserInfo().getName());
            }


        Map<String, String> mobileNumberAndMessage = getMessageForMobileNumber(mobileNumbersAndNames,
                waterConnectionRequest, message, property);
        if (message.contains("{receipt download link}"))
            mobileNumberAndMessage = setRecepitDownloadLink(mobileNumberAndMessage, waterConnectionRequest, message, property);
        List<SMSRequest> smsRequest = new ArrayList<>();
        mobileNumberAndMessage.forEach((mobileNumber, msg) -> {
            SMSRequest req = SMSRequest.builder().mobileNumber(mobileNumber).message(msg).category(Category.NOTIFICATION).build();
            smsRequest.add(req);
        });
        return smsRequest;
    }

    /**
     * Creates email request for each owner
     *
     * @param waterConnectionRequest Water Connection Request
     * @param topic Topic Name
     * @param property Property Object
     * @param applicationStatus Application Status
     * @return List of EmailRequest
     */
    private List<EmailRequest> getEmailRequest(WaterConnectionRequest waterConnectionRequest, String topic,
                                           Property property, String applicationStatus) {
        String localizationMessage = notificationUtil.getLocalizationMessages(property.getTenantId(),
                waterConnectionRequest.getRequestInfo());
        ProcessInstance workflow = waterConnectionRequest.getWaterConnection().getProcessInstance();

        int reqType = WCConstants.UPDATE_APPLICATION;
        if ((!workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION))
                && waterServiceUtil.isModifyConnectionRequestForNotification(waterConnectionRequest)) {
            reqType = WCConstants.MODIFY_CONNECTION;
        }
        if ((!workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION))
                && waterServiceUtil.isMutationConnectionRequest(waterConnectionRequest)) {
            reqType = WCConstants.MUTATION_CONNECTION;
        }
        if((!workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION)) &&
                (!workflow.getAction().equalsIgnoreCase(APPROVE_CONNECTION)) &&
                waterServiceUtil.isDisconnectConnectionRequest(waterConnectionRequest))
        {
            reqType = DISCONNECT_CONNECTION;
        }

        if((workflow.getAction().equalsIgnoreCase(WCConstants.ACTIVATE_CONNECTION)) &&
        		waterServiceUtil.isReconnectConnectionRequest(waterConnectionRequest))
        {
        	reqType = RECONNECTION;
        }
        
        String message = notificationUtil.getCustomizedMsgForEmail(
                workflow.getAction(), applicationStatus,
                localizationMessage, reqType);
        if(workflow.getAction().equalsIgnoreCase(APPROVE_DISCONNECTION_CONST) && workflow.getComment()!=null
                && workflow.getComment().contains(WORKFLOW_NO_PAYMENT_CODE))
        {
            message = notificationUtil.getCustomizedMsgForEmail(workflow.getAction(), PENDING_FOR_DISCONNECTION_EXECUTION_STATUS_CODE,
                    localizationMessage, reqType);
        }
        if(workflow.getAction().equalsIgnoreCase(ACTION_PAY) && workflow.getComment()!=null
                && workflow.getComment().contains(WORKFLOW_NO_PAYMENT_CODE))
        {
            log.info("Skipping for action status -> "+workflow.getAction().equalsIgnoreCase(ACTION_PAY)+"_"+waterConnectionRequest.getWaterConnection().getApplicationStatus()
                    +" because -> "+workflow.getComment());
            return Collections.emptyList();
        }
        if (message == null) {
            log.info("No message Found For Topic : " + topic);
            return Collections.emptyList();
        }

        //Send the notification to all owners
        Set<String> ownersUuids = new HashSet<>();

        property.getOwners().forEach(owner -> {
            if (owner.getUuid() != null)
                ownersUuids.add(owner.getUuid());
        });

        //send the notification to the connection holders
        if (!CollectionUtils.isEmpty(waterConnectionRequest.getWaterConnection().getConnectionHolders())) {
            waterConnectionRequest.getWaterConnection().getConnectionHolders().forEach(holder -> {
                if (!StringUtils.isEmpty(holder.getUuid())) {
                    ownersUuids.add(holder.getUuid());
                }
            });
        }

        UserDetailResponse userDetailResponse = fetchUserByUUID(ownersUuids,waterConnectionRequest.getRequestInfo(),waterConnectionRequest.getWaterConnection().getTenantId());
        Map<String, String> mobileNumbersAndNames = new HashMap<>();
        for(OwnerInfo user:userDetailResponse.getUser())
        {
            mobileNumbersAndNames.put(user.getMobileNumber(),user.getName());
        }

        Set<String> mobileNumbers = new HashSet<String>();
        mobileNumbers.addAll(mobileNumbersAndNames.keySet());

        Map<String,String> mobileNumberAndEmailId = new HashMap<>();
        for(OwnerInfo user:userDetailResponse.getUser()) {
            mobileNumberAndEmailId.put(user.getMobileNumber(), user.getEmailId());
        }

        //Send the notification to applicant
        if(!StringUtils.isEmpty(waterConnectionRequest.getRequestInfo().getUserInfo().getMobileNumber()))
        {
            mobileNumbersAndNames.put(waterConnectionRequest.getRequestInfo().getUserInfo().getMobileNumber(), waterConnectionRequest.getRequestInfo().getUserInfo().getName());
            mobileNumbers.add(waterConnectionRequest.getRequestInfo().getUserInfo().getMobileNumber());
            mobileNumberAndEmailId.put(waterConnectionRequest.getRequestInfo().getUserInfo().getMobileNumber(), waterConnectionRequest.getRequestInfo().getUserInfo().getEmailId());
        }

        Map<String, String> mobileNumberAndMessage = getMessageForMobileNumber(mobileNumbersAndNames,
                waterConnectionRequest, message, property);

        if (message.contains("{receipt download link}"))
            mobileNumberAndMessage = setRecepitDownloadLink(mobileNumberAndMessage, waterConnectionRequest, message, property);

        List<EmailRequest> emailRequest = new LinkedList<>();
        for (Map.Entry<String, String> entryset : mobileNumberAndEmailId.entrySet()) {
            String customizedMsg = mobileNumberAndMessage.get(entryset.getKey());
            String subject = customizedMsg.substring(customizedMsg.indexOf("<h2>")+4,customizedMsg.indexOf("</h2>"));
            String body = customizedMsg.substring(customizedMsg.indexOf("</h2>")+5);
            Email emailobj = Email.builder().emailTo(Collections.singleton(entryset.getValue())).isHTML(true).body(body).subject(subject).build();
            EmailRequest email = new EmailRequest(waterConnectionRequest.getRequestInfo(),emailobj);
            emailRequest.add(email);
        }
        return emailRequest;

    }

    public Map<String, String> getMessageForMobileNumber(Map<String, String> mobileNumbersAndNames,
                                                         WaterConnectionRequest waterConnectionRequest, String message, Property property) {
        Map<String, String> messageToReturn = new HashMap<>();
        for (Entry<String, String> mobileAndName : mobileNumbersAndNames.entrySet()) {
            String messageToReplace = message;
            Boolean isConnectionNoPresent = !StringUtils.isEmpty(waterConnectionRequest.getWaterConnection().getConnectionNo());

            if (messageToReplace.contains("{Owner Name}")) {
                String ownerName = !StringUtils.isEmpty(mobileAndName.getValue()) ? mobileAndName.getValue()
                        : (!CollectionUtils.isEmpty(waterConnectionRequest.getWaterConnection().getConnectionHolders())
                            ? waterConnectionRequest.getWaterConnection().getConnectionHolders().get(0).getName() : "");
                messageToReplace = messageToReplace.replace("{Owner Name}", ownerName);
            }
            if (messageToReplace.contains("{Service}"))
                messageToReplace = messageToReplace.replace("{Service}", WCConstants.SERVICE_FIELD_VALUE_NOTIFICATION);

            if (messageToReplace.contains("{Plumb Info}"))
                messageToReplace = getMessageForPlumberInfo(waterConnectionRequest.getWaterConnection(), messageToReplace);

            if (messageToReplace.contains("{SLA}"))
                messageToReplace = messageToReplace.replace("{SLA}", getSLAForState(waterConnectionRequest, property, config.getBusinessServiceValue()));

            if (messageToReplace.contains("{Application number}"))
                messageToReplace = messageToReplace.replace("{Application number}", waterConnectionRequest.getWaterConnection().getApplicationNo());

            if (messageToReplace.contains("{Connection number}"))
                messageToReplace = messageToReplace.replace("{Connection number}", isConnectionNoPresent ? waterConnectionRequest.getWaterConnection().getConnectionNo() : "NA");

            if(messageToReplace.contains("{Reason for Rejection}"))
                messageToReplace = messageToReplace.replace("{Reason for Rejection}",  waterConnectionRequest.getWaterConnection().getProcessInstance().getComment());

            if (messageToReplace.contains("{Application download link}")) {
                String actionLink = config.getNotificationUrl() + config.getViewHistoryLink();
                actionLink = actionLink.replace(applicationNumberReplacer, waterConnectionRequest.getWaterConnection().getApplicationNo());
                messageToReplace = messageToReplace.replace("{Application download link}", waterServiceUtil.getShortnerURL(actionLink));
            }

            if (messageToReplace.contains("{mseva URL}"))
                messageToReplace = messageToReplace.replace("{mseva URL}",
                        waterServiceUtil.getShortnerURL(config.getNotificationUrl()));

            if (messageToReplace.contains("{mseva app link}"))
                messageToReplace = messageToReplace.replace("{mseva app link}",
                        waterServiceUtil.getShortnerURL(config.getMSevaAppLink()));

            if (messageToReplace.contains("{View History Link}")) {
                String historyLink = config.getNotificationUrl() + config.getViewHistoryLink();
                historyLink = historyLink.replace(mobileNoReplacer, mobileAndName.getKey());
                historyLink = historyLink.replace(applicationNumberReplacer, waterConnectionRequest.getWaterConnection().getApplicationNo());
                historyLink = historyLink.replace(tenantIdReplacer, property.getTenantId());
                messageToReplace = messageToReplace.replace("{View History Link}",
                        waterServiceUtil.getShortnerURL(historyLink));
            }
            if (messageToReplace.contains("{payment link}")) {
                String paymentLink = config.getNotificationUrl() +  config.getViewHistoryLink();
                paymentLink = paymentLink.replace(mobileNoReplacer, mobileAndName.getKey());
                paymentLink = paymentLink.replace(applicationNumberReplacer, waterConnectionRequest.getWaterConnection().getApplicationNo());
                paymentLink = paymentLink.replace(tenantIdReplacer, property.getTenantId());
                messageToReplace = messageToReplace.replace("{payment link}",
                        waterServiceUtil.getShortnerURL(paymentLink));
            }
			/*if (messageToReplace.contains("{receipt download link}")){
				messageToReplace = messageToReplace.replace("{receipt download link}",
						waterServiceUtil.getShortnerURL(config.getNotificationUrl()));
			}*/
            if (messageToReplace.contains("{connection details page}")) {
                String connectionDetaislLink = config.getNotificationUrl() + config.getConnectionDetailsLink();
                connectionDetaislLink = connectionDetaislLink.replace(applicationNumberReplacer,
                        waterConnectionRequest.getWaterConnection().getApplicationNo());
                messageToReplace = messageToReplace.replace("{connection details page}",
                        waterServiceUtil.getShortnerURL(connectionDetaislLink));
            }
            if (messageToReplace.contains("{Date effective from}")) {
                if (waterConnectionRequest.getWaterConnection().getDateEffectiveFrom() != null) {
                    LocalDate date = Instant
                            .ofEpochMilli(waterConnectionRequest.getWaterConnection().getDateEffectiveFrom() > 10
                                    ? waterConnectionRequest.getWaterConnection().getDateEffectiveFrom()
                                    : waterConnectionRequest.getWaterConnection().getDateEffectiveFrom() * 1000)
                            .atZone(ZoneId.systemDefault()).toLocalDate();
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                    messageToReplace = messageToReplace.replace("{Date effective from}", date.format(formatter));
                } else {
                    messageToReplace = messageToReplace.replace("{Date effective from}", "");
                }
            }
            messageToReturn.put(mobileAndName.getKey(), messageToReplace);
        }
        return messageToReturn;
    }

    /**
     * This method returns message to replace for plumber info depending upon
     * whether the plumber info type is either SELF or ULB
     *
     * @param waterConnection Water Connection Object
     * @param messageTemplate Message Template
     * @return updated messageTemplate
     */

    @SuppressWarnings("unchecked")
    public String getMessageForPlumberInfo(WaterConnection waterConnection, String messageTemplate) {
        HashMap<String, Object> addDetail = mapper.convertValue(waterConnection.getAdditionalDetails(),
                HashMap.class);
        if(!StringUtils.isEmpty(String.valueOf(addDetail.get(WCConstants.DETAILS_PROVIDED_BY)))){
            String detailsProvidedBy = String.valueOf(addDetail.get(WCConstants.DETAILS_PROVIDED_BY));
            if ( StringUtils.isEmpty(detailsProvidedBy) || detailsProvidedBy.equalsIgnoreCase(WCConstants.SELF)) {
                String code = StringUtils.substringBetween(messageTemplate, "{Plumb Info}", "{/Plumb Info}");
                messageTemplate = messageTemplate.replace("{Plumb Info}", "");
                messageTemplate = messageTemplate.replace("{/Plumb Info}", "");
                messageTemplate = messageTemplate.replace(code, "");
            } else {
                messageTemplate = messageTemplate.replace("{Plumb Info}", "").replace("{/Plumb Info}", "");
                messageTemplate = messageTemplate.replace("{Plumb name}",
                        StringUtils.isEmpty(waterConnection.getPlumberInfo().get(0).getName()) ? ""
                                : waterConnection.getPlumberInfo().get(0).getName());
                messageTemplate = messageTemplate.replace("{Plumb Licence No.}",
                        StringUtils.isEmpty(waterConnection.getPlumberInfo().get(0).getLicenseNo()) ? ""
                                : waterConnection.getPlumberInfo().get(0).getLicenseNo());
                messageTemplate = messageTemplate.replace("{Plumb Mobile No.}",
                        StringUtils.isEmpty(waterConnection.getPlumberInfo().get(0).getMobileNumber()) ? ""
                                : waterConnection.getPlumberInfo().get(0).getMobileNumber());
            }

        }else{
            String code = StringUtils.substringBetween(messageTemplate, "{Plumb Info}", "{/Plumb Info}");
            messageTemplate = messageTemplate.replace("{Plumb Info}", "");
            messageTemplate = messageTemplate.replace("{/Plumb Info}", "");
            messageTemplate = messageTemplate.replace(code, "");
        }
        return messageTemplate;

    }

    /**
     * Fetches SLA of CITIZEN based on the phone number.
     *
     * @param connectionRequest Water Connection Request
     * @param property Property
     * @return string consisting SLA
     */

    public String getSLAForState(WaterConnectionRequest connectionRequest, Property property, String businessServiceName) {
        String resultSla = "";
        BusinessService businessService = workflowService.getBusinessService(property.getTenantId(),
                connectionRequest.getRequestInfo(), businessServiceName);
        if (businessService != null && businessService.getStates() != null && businessService.getStates().size() > 0) {
            for (State state : businessService.getStates()) {
                if (WCConstants.PENDING_FOR_CONNECTION_ACTIVATION.equalsIgnoreCase(state.getState())) {
                    resultSla = String.valueOf((state.getSla() == null ? 0L : state.getSla()) / 86400000);
                }
            }
        }
        return resultSla;
    }


    /**
     * Fetches UUIDs of CITIZEN based on the phone number.
     *
     * @param mobileNumbers - List of Mobile Numbers
     * @param requestInfo - Request Information
     * @param tenantId - Tenant Id
     * @return Returns List of MobileNumbers and UUIDs
     */
    public Map<String, String> fetchUserUUIDs(Set<String> mobileNumbers, RequestInfo requestInfo, String tenantId) {
        Map<String, String> mapOfPhoneNoAndUUIDs = new HashMap<>();
        StringBuilder uri = new StringBuilder();
        uri.append(config.getUserHost()).append(config.getUserSearchEndpoint());
        Map<String, Object> userSearchRequest = new HashMap<>();
        userSearchRequest.put("RequestInfo", requestInfo);
        userSearchRequest.put("tenantId", tenantId);
        userSearchRequest.put("userType", "CITIZEN");
        for(String mobileNo: mobileNumbers) {
            userSearchRequest.put("userName", mobileNo);
            try {
                Object user = serviceRequestRepository.fetchResult(uri, userSearchRequest);
                if(null != user) {
                    String uuid = JsonPath.read(user, "$.user[0].uuid");
                    mapOfPhoneNoAndUUIDs.put(mobileNo, uuid);
                }else {
                    log.error("Service returned null while fetching user for username - "+mobileNo);
                }
            }catch(Exception e) {
                log.error("Exception while fetching user for username - "+mobileNo);
                log.error("Exception trace: ",e);
            }
        }
        return mapOfPhoneNoAndUUIDs;
    }

    /**
     * Fetch URL for application download link
     *
     * @param waterConnectionRequest Water Connection Request
     * @param property Property
     * @return application download link
     */
    private String getApplicationDownloadLink(WaterConnectionRequest waterConnectionRequest, Property property) {
        CalculationCriteria criteria = CalculationCriteria.builder().applicationNo(waterConnectionRequest.getWaterConnection().getApplicationNo())
                .waterConnection(waterConnectionRequest.getWaterConnection()).tenantId(property.getTenantId()).build();
        CalculationReq calRequest = CalculationReq.builder().calculationCriteria(Arrays.asList(criteria))
                .requestInfo(waterConnectionRequest.getRequestInfo()).isconnectionCalculation(false).isDisconnectionRequest(false).isReconnectionRequest(false).build();
        try {
            Object response = serviceRequestRepository.fetchResult(waterServiceUtil.getEstimationURL(), calRequest);
            CalculationRes calResponse = mapper.convertValue(response, CalculationRes.class);
            JSONObject waterObject = mapper.convertValue(waterConnectionRequest.getWaterConnection(), JSONObject.class);
            if (CollectionUtils.isEmpty(calResponse.getCalculation())) {
                throw new CustomException("NO_ESTIMATION_FOUND", "Estimation not found!!!");
            }
            waterObject.put(totalAmount, calResponse.getCalculation().get(0).getTotalAmount());
            waterObject.put(applicationFee, calResponse.getCalculation().get(0).getFee());
            waterObject.put(serviceFee, calResponse.getCalculation().get(0).getCharge());
            waterObject.put(tax, calResponse.getCalculation().get(0).getTaxAmount());
            waterObject.put(propertyKey, property);
            //String tenantId = property.getTenantId().split("\\.")[0];
            String tenantId = centralInstanceUtil.getStateLevelTenant(property.getTenantId());
            String fileStoreId = getFielStoreIdFromPDFService(waterObject, waterConnectionRequest.getRequestInfo(), tenantId);
            return getApplicationDownloadLink(tenantId, fileStoreId);
        } catch (Exception ex) {
            log.error("Calculation response error!!", ex);
            throw new CustomException("WATER_CALCULATION_EXCEPTION", "Calculation response can not parsed!!!");
        }
    }
    /**
     * Get file store id from PDF service
     *
     * @param waterObject Water Connection Object
     * @param requestInfo Request Information
     * @param tenantId Tenant Id
     * @return file store id
     */
    private String getFielStoreIdFromPDFService(JSONObject waterObject, RequestInfo requestInfo, String tenantId) {
        JSONArray waterConnectionList = new JSONArray();
        waterConnectionList.add(waterObject);
        JSONObject requestPayload = new JSONObject();
        requestPayload.put(requestInfoReplacer, requestInfo);
        requestPayload.put(WaterConnectionReplacer, waterConnectionList);
        try {
            StringBuilder builder = new StringBuilder();
            builder.append(config.getPdfServiceHost());
            String pdfLink = config.getPdfServiceLink();
            pdfLink = pdfLink.replace(tenantIdReplacer, tenantId).replace(applicationKey, WCConstants.PDF_APPLICATION_KEY);
            builder.append(pdfLink);
            Object response = serviceRequestRepository.fetchResult(builder, requestPayload);
            DocumentContext responseContext = JsonPath.parse(response);
            List<Object> fileStoreIds = responseContext.read("$.filestoreIds");
            if(CollectionUtils.isEmpty(fileStoreIds)) {
                throw new CustomException("EMPTY_FILESTORE_IDS_FROM_PDF_SERVICE", "File Store Id doesn't exist in pdf service");
            }
            return fileStoreIds.get(0).toString();
        } catch (Exception ex) {
            log.error("PDF file store id response error!!", ex);
            throw new CustomException("WATER_FILESTORE_PDF_EXCEPTION", "PDF response can not parsed!!!");
        }
    }

    /**
     *
     * @param tenantId TenantId
     * @param fileStoreId File Store Id
     * @return file store id
     */
    private String getApplicationDownloadLink(String tenantId, String fileStoreId) {
        String fileStoreServiceLink = config.getFileStoreHost() + config.getFileStoreLink();
        fileStoreServiceLink = fileStoreServiceLink.replace(tenantIdReplacer, tenantId);
        fileStoreServiceLink = fileStoreServiceLink.replace(fileStoreIdReplacer, fileStoreId);
        try {
            Object response = serviceRequestRepository.fetchResultUsingGet(new StringBuilder(fileStoreServiceLink));
            DocumentContext responseContext = JsonPath.parse(response);
            List<Object> fileStoreIds = responseContext.read("$.fileStoreIds");
            if (CollectionUtils.isEmpty(fileStoreIds)) {
                throw new CustomException("EMPTY_FILESTORE_IDS_FROM_PDF_SERVICE",
                        "NO file store id found from pdf service");
            }
            JSONObject obje = mapper.convertValue(fileStoreIds.get(0), JSONObject.class);
            return obje.get(urlReplacer).toString();
        } catch (Exception ex) {
            log.error("PDF file store id response error!!", ex);
            throw new CustomException("WATER_FILESTORE_PDF_EXCEPTION", "PDF response can not parsed!!!");
        }
    }

	public Map<String, String> setRecepitDownloadLink(Map<String, String> mobileNumberAndMessage,
                                                      WaterConnectionRequest waterConnectionRequest, String message, Property property) {

        Map<String, String> messageToReturn = new HashMap<>();
        String receiptNumber = getReceiptNumber(waterConnectionRequest);
        for (Entry<String, String> mobileAndMsg : mobileNumberAndMessage.entrySet()) {
            String messageToReplace = mobileAndMsg.getValue();
            String link = config.getNotificationUrl() + config.getMyPaymentsLink();
            link = waterServiceUtil.getShortnerURL(link);
            messageToReplace = messageToReplace.replace("{receipt download link}", link);
            messageToReturn.put(mobileAndMsg.getKey(), messageToReplace);

        }
        return messageToReturn;

    }

    public String getReceiptNumber(WaterConnectionRequest waterConnectionRequest){
        String consumerCode,service;
        if(StringUtils.isEmpty(waterConnectionRequest.getWaterConnection().getConnectionNo())){
            consumerCode = waterConnectionRequest.getWaterConnection().getApplicationNo();
            service = businessService;
        }
        else{
            consumerCode = waterConnectionRequest.getWaterConnection().getConnectionNo();
            service = "WS";
        }
        StringBuilder URL = waterServiceUtil.getcollectionURL();
        URL.append(service).append("/_search").append("?").append("consumerCodes=").append(consumerCode)
                .append("&").append("tenantId=").append(waterConnectionRequest.getWaterConnection().getTenantId());
        RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(waterConnectionRequest.getRequestInfo()).build();
        Object response = serviceRequestRepository.fetchResult(URL,requestInfoWrapper);
        PaymentResponse paymentResponse = mapper.convertValue(response, PaymentResponse.class);
        return paymentResponse.getPayments().get(0).getPaymentDetails().get(0).getReceiptNumber();
    }

    /**
     * Fetches User Object based on the UUID.
     *
     * @param uuids - set of UUIDs of User
     * @param requestInfo - Request Info Object
     * @param tenantId - Tenant Id
     * @return - Returns User object with given UUID
     */
    public UserDetailResponse fetchUserByUUID(Set<String> uuids, RequestInfo requestInfo, String tenantId) {
        User userInfoCopy = requestInfo.getUserInfo();

        User userInfo = notificationUtil.getInternalMicroserviceUser(tenantId);
        requestInfo.setUserInfo(userInfo);

        UserSearchRequest userSearchRequest = userService.getBaseUserSearchRequest(tenantId, requestInfo);
        userSearchRequest.setUuid(uuids);

        UserDetailResponse userDetailResponse = userService.getUser(userSearchRequest);
        requestInfo.setUserInfo(userInfoCopy);
        return userDetailResponse;
    }

    /**
     * Fetches User Object based on the UUID.
     *
     * @param username - username of User
     * @param requestInfo - Request Info Object
     * @param tenantId - Tenant Id
     * @return - Returns User object with given UUID
     */
    public UserDetailResponse fetchUserByUsername(String username, RequestInfo requestInfo, String tenantId) {
        User userInfoCopy = requestInfo.getUserInfo();

        User userInfo = notificationUtil.getInternalMicroserviceUser(tenantId);
        requestInfo.setUserInfo(userInfo);

        UserSearchRequest userSearchRequest = userService.getBaseUserSearchRequest(tenantId, requestInfo);
        userSearchRequest.setUserName(username);

        UserDetailResponse userDetailResponse = userService.getUser(userSearchRequest);
        requestInfo.setUserInfo(userInfoCopy);
        return userDetailResponse;
    }

    /**
     * Processes WhatsApp notifications based on workflow action and application type.
     * Non-blocking and isolated from other notification channels.
     * 
     * @param request WaterConnectionRequest
     * @param property Property
     * @param tenantId Tenant ID
     */
    private void processWhatsAppNotifications(WaterConnectionRequest request, Property property, String tenantId) {
        if (request == null || request.getWaterConnection() == null || request.getWaterConnection().getProcessInstance() == null) {
            return;
        }

        String action = request.getWaterConnection().getProcessInstance().getAction();
        String appType = request.getWaterConnection().getApplicationType();

        // Check for New Water Connection Application
        boolean isNewConnection = appType == null 
                || WCConstants.NEW_WATER_CONNECTION.equalsIgnoreCase(appType)
                || "NEW_WATER_CONNECTION".equalsIgnoreCase(appType);

        if (isNewConnection && WCConstants.SUBMIT_APPLICATION_CONST.equalsIgnoreCase(action)) {
            List<WhatsAppRequest> whatsappRequests = getWhatsAppRequestForAppSubmission(request, property);
            if (!CollectionUtils.isEmpty(whatsappRequests)) {
                notificationUtil.sendWhatsApp(whatsappRequests, tenantId);
            }
        } else if (isNewConnection && (WCConstants.ACTION_REJECT.equalsIgnoreCase(action)
                || WCConstants.STATUS_REJECTED.equalsIgnoreCase(request.getWaterConnection().getApplicationStatus()))) {
            List<WhatsAppRequest> whatsappRequests = getWhatsAppRequestForAppRejection(request, property);
            if (!CollectionUtils.isEmpty(whatsappRequests)) {
                notificationUtil.sendWhatsApp(whatsappRequests, tenantId);
            }
        } else if (isNewConnection && (WCConstants.ACTION_SEND_BACK_TO_CITIZEN.equalsIgnoreCase(action)
                || WCConstants.ACTION_SEND_BACK_TO_CITIZEN_DIRECT.equalsIgnoreCase(action))) {
            List<WhatsAppRequest> whatsappRequests = getWhatsAppRequestForQueryRaised(request, property);
            if (!CollectionUtils.isEmpty(whatsappRequests)) {
                notificationUtil.sendWhatsApp(whatsappRequests, tenantId);
            }
        } else if (isNewConnection && (WCConstants.APPROVE_CONNECTION_CONST.equalsIgnoreCase(action)
                || "APPROVE_FOR_CONNECTION".equalsIgnoreCase(action))) {
            List<WhatsAppRequest> whatsappRequests = getWhatsAppRequestForAppApproved(request, property);
            if (!CollectionUtils.isEmpty(whatsappRequests)) {
                notificationUtil.sendWhatsApp(whatsappRequests, tenantId);
            }
        } else if (isNewConnection && (WCConstants.ACTIVATE_CONNECTION_CONST.equalsIgnoreCase(action)
                || "ACTIVATE_CONNECTION".equalsIgnoreCase(action)
                || WCConstants.STATUS_APPROVED.equalsIgnoreCase(request.getWaterConnection().getApplicationStatus()))) {
            List<WhatsAppRequest> whatsappRequests = getWhatsAppRequestForConnectionActivated(request, property);
            if (!CollectionUtils.isEmpty(whatsappRequests)) {
                notificationUtil.sendWhatsApp(whatsappRequests, tenantId);
            }
        }
    }

    /**
     * Extracts mobile numbers and names for notification recipients (Owners, Connection Holders, Applicant).
     */
    private Map<String, String> extractRecipientMobileNumbersAndNames(WaterConnectionRequest request, Property property, WaterConnection connection) {
        Map<String, String> mobileNumbersAndNames = new HashMap<>();
        Set<String> ownersUuids = new HashSet<>();

        // 1. Owners from Property
        if (property != null && !CollectionUtils.isEmpty(property.getOwners())) {
            property.getOwners().forEach(owner -> {
                if (!StringUtils.isEmpty(owner.getMobileNumber())) {
                    mobileNumbersAndNames.put(owner.getMobileNumber(), owner.getName());
                } else if (!StringUtils.isEmpty(owner.getUuid())) {
                    ownersUuids.add(owner.getUuid());
                }
            });
        }

        // 2. Connection Holders
        if (!CollectionUtils.isEmpty(connection.getConnectionHolders())) {
            connection.getConnectionHolders().forEach(holder -> {
                if (!StringUtils.isEmpty(holder.getMobileNumber())) {
                    mobileNumbersAndNames.put(holder.getMobileNumber(), holder.getName());
                } else if (!StringUtils.isEmpty(holder.getUuid())) {
                    ownersUuids.add(holder.getUuid());
                }
            });
        }

        // 3. Fallback: Fetch missing users by UUID if necessary
        if (!CollectionUtils.isEmpty(ownersUuids)) {
            try {
                UserDetailResponse userDetailResponse = fetchUserByUUID(ownersUuids, request.getRequestInfo(), connection.getTenantId());
                if (userDetailResponse != null && !CollectionUtils.isEmpty(userDetailResponse.getUser())) {
                    for (OwnerInfo user : userDetailResponse.getUser()) {
                        if (!StringUtils.isEmpty(user.getMobileNumber())) {
                            mobileNumbersAndNames.put(user.getMobileNumber(), user.getName());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Error fetching user details by UUID for WhatsApp notification", e);
            }
        }

        // 4. Applicant from RequestInfo UserInfo
        if (request.getRequestInfo() != null && request.getRequestInfo().getUserInfo() != null) {
            User userInfo = request.getRequestInfo().getUserInfo();
            if (!StringUtils.isEmpty(userInfo.getMobileNumber()) 
                    && (userInfo.getType() == null || !"SYSTEM".equalsIgnoreCase(userInfo.getType()))) {
                mobileNumbersAndNames.put(userInfo.getMobileNumber(), userInfo.getName());
            }
        }

        return mobileNumbersAndNames;
    }

    /**
     * Prepares WhatsAppRequest for New Connection Application Submission.
     * Template: nc_application_submitted
     * Parameters:
     *   {{1}} -> Applicant / Owner Name
     *   {{2}} -> Application No
     *   {{3}} -> Submission Date (dd-MM-yyyy)
     * 
     * @param request WaterConnectionRequest
     * @param property Property
     * @return List of WhatsAppRequest
     */
    private List<WhatsAppRequest> getWhatsAppRequestForAppSubmission(WaterConnectionRequest request, Property property) {
        WaterConnection connection = request.getWaterConnection();
        if (connection == null) {
            return Collections.emptyList();
        }

        Map<String, String> mobileNumbersAndNames = extractRecipientMobileNumbersAndNames(request, property, connection);
        if (CollectionUtils.isEmpty(mobileNumbersAndNames)) {
            log.info("No mobile numbers found for WhatsApp submission notification on application: {}", connection.getApplicationNo());
            return Collections.emptyList();
        }

        // Format submission date as dd-MM-yyyy (Asia/Kolkata timezone)
        Long createdTime = null;
        if (connection.getAuditDetails() != null && connection.getAuditDetails().getCreatedTime() != null) {
            createdTime = connection.getAuditDetails().getCreatedTime();
        } else {
            createdTime = System.currentTimeMillis();
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy").withZone(ZoneId.of("Asia/Kolkata"));
        String submissionDate = formatter.format(Instant.ofEpochMilli(createdTime));

        String applicationNo = connection.getApplicationNo();
        String templateName = config.getNcApplicationSubmittedTemplateName();

        List<WhatsAppRequest> whatsappRequests = new ArrayList<>();
        mobileNumbersAndNames.forEach((mobileNumber, name) -> {
            String applicantName = !StringUtils.isEmpty(name) ? name : "Citizen";
            List<String> parameters = Arrays.asList(
                    applicantName,
                    applicationNo,
                    submissionDate
            );

            WhatsAppRequest req = WhatsAppRequest.builder()
                    .mobileNumber(mobileNumber)
                    .templateName(templateName)
                    .parameters(parameters)
                    .build();
            whatsappRequests.add(req);
        });

        return whatsappRequests;
    }

    /**
     * Prepares WhatsAppRequest for New Connection Application Rejection.
     * Template: nc_application_rejected
     * Parameters:
     *   {{1}} -> Applicant / Owner Name
     *   {{2}} -> Application Number
     *   {{3}} -> Decision Date (dd-MM-yyyy)
     *   {{4}} -> Reason for Rejection
     * 
     * @param request WaterConnectionRequest
     * @param property Property
     * @return List of WhatsAppRequest
     */
    private List<WhatsAppRequest> getWhatsAppRequestForAppRejection(WaterConnectionRequest request, Property property) {
        WaterConnection connection = request.getWaterConnection();
        if (connection == null) {
            return Collections.emptyList();
        }

        Map<String, String> mobileNumbersAndNames = extractRecipientMobileNumbersAndNames(request, property, connection);
        if (CollectionUtils.isEmpty(mobileNumbersAndNames)) {
            log.info("No mobile numbers found for WhatsApp rejection notification on application: {}", connection.getApplicationNo());
            return Collections.emptyList();
        }

        // Format decision date as dd-MM-yyyy (Asia/Kolkata timezone)
        Long decisionTime = null;
        if (connection.getAuditDetails() != null && connection.getAuditDetails().getLastModifiedTime() != null) {
            decisionTime = connection.getAuditDetails().getLastModifiedTime();
        } else {
            decisionTime = System.currentTimeMillis();
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy").withZone(ZoneId.of("Asia/Kolkata"));
        String decisionDate = formatter.format(Instant.ofEpochMilli(decisionTime));

        String applicationNo = connection.getApplicationNo();
        String templateName = config.getNcApplicationRejectedTemplateName();

        // Reason for rejection from workflow comment / remarks (sanitized with comma for WhatsApp API rules)
        String rejectionReason = "Document or details not valid";
        if (connection.getProcessInstance() != null && !StringUtils.isEmpty(connection.getProcessInstance().getComment())) {
            rejectionReason = connection.getProcessInstance().getComment()
                    .trim()
                    .replaceAll("[\\r\\n\\t]+", ", ")
                    .replaceAll(",+", ",")
                    .replaceAll(" {2,}", " ")
                    .trim();
        }

        List<WhatsAppRequest> whatsappRequests = new ArrayList<>();
        final String finalRejectionReason = rejectionReason;
        mobileNumbersAndNames.forEach((mobileNumber, name) -> {
            String applicantName = !StringUtils.isEmpty(name) ? name : "Citizen";
            List<String> parameters = Arrays.asList(
                    applicantName,
                    applicationNo,
                    decisionDate,
                    finalRejectionReason
            );

            WhatsAppRequest req = WhatsAppRequest.builder()
                    .mobileNumber(mobileNumber)
                    .templateName(templateName)
                    .parameters(parameters)
                    .build();
            whatsappRequests.add(req);
        });

        return whatsappRequests;
    }

    /**
     * Prepares WhatsAppRequest for New Connection Query Raised / Send Back to Citizen.
     * Template: nc_query_raised
     * Parameters:
     *   {{1}} -> Applicant / Owner Name
     *   {{2}} -> Application Number
     *   {{3}} -> Query Raised By (e.g. Zonal Revenue Office)
     *   {{4}} -> Query Date (dd-MM-yyyy)
     * 
     * @param request WaterConnectionRequest
     * @param property Property
     * @return List of WhatsAppRequest
     */
    private List<WhatsAppRequest> getWhatsAppRequestForQueryRaised(WaterConnectionRequest request, Property property) {
        WaterConnection connection = request.getWaterConnection();
        if (connection == null) {
            return Collections.emptyList();
        }

        Map<String, String> mobileNumbersAndNames = extractRecipientMobileNumbersAndNames(request, property, connection);
        if (CollectionUtils.isEmpty(mobileNumbersAndNames)) {
            log.info("No mobile numbers found for WhatsApp query raised notification on application: {}", connection.getApplicationNo());
            return Collections.emptyList();
        }

        // Format query date as dd-MM-yyyy (Asia/Kolkata timezone)
        Long queryTime = null;
        if (connection.getAuditDetails() != null && connection.getAuditDetails().getLastModifiedTime() != null) {
            queryTime = connection.getAuditDetails().getLastModifiedTime();
        } else {
            queryTime = System.currentTimeMillis();
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy").withZone(ZoneId.of("Asia/Kolkata"));
        String queryDate = formatter.format(Instant.ofEpochMilli(queryTime));

        String applicationNo = connection.getApplicationNo();
        String templateName = config.getNcQueryRaisedTemplateName();
        String queryRaisedBy = "Zonal Revenue Office";

        List<WhatsAppRequest> whatsappRequests = new ArrayList<>();
        mobileNumbersAndNames.forEach((mobileNumber, name) -> {
            String applicantName = !StringUtils.isEmpty(name) ? name : "Citizen";
            List<String> parameters = Arrays.asList(
                    applicantName,
                    applicationNo,
                    queryRaisedBy,
                    queryDate
            );

            WhatsAppRequest req = WhatsAppRequest.builder()
                    .mobileNumber(mobileNumber)
                    .templateName(templateName)
                    .parameters(parameters)
                    .build();
            whatsappRequests.add(req);
        });

        return whatsappRequests;
    }

    /**
     * Prepares WhatsAppRequest for New Connection Application Approval.
     * Template: nc_application_approved_notice
     * Parameters:
     *   {{1}} -> Consumer / Applicant Name
     *   {{2}} -> Application Number
     *   {{3}} -> Zone
     *   {{4}} -> ZRO Office
     *   {{5}} -> Connection Type
     *   {{6}} -> Approval Date (dd-MM-yyyy)
     *   {{7}} -> Timeline (7 days after approval date, dd-MM-yyyy)
     *   {{8}} -> Consent Letter / Notice Download Link (PDF)
     * 
     * @param request WaterConnectionRequest
     * @param property Property
     * @return List of WhatsAppRequest
     */
    private List<WhatsAppRequest> getWhatsAppRequestForAppApproved(WaterConnectionRequest request, Property property) {
        WaterConnection connection = request.getWaterConnection();
        if (connection == null) {
            return Collections.emptyList();
        }

        Map<String, String> mobileNumbersAndNames = extractRecipientMobileNumbersAndNames(request, property, connection);
        if (CollectionUtils.isEmpty(mobileNumbersAndNames)) {
            log.info("No mobile numbers found for WhatsApp approval notification on application: {}", connection.getApplicationNo());
            return Collections.emptyList();
        }

        // Format approval/activation date as dd-MM-yyyy (Asia/Kolkata timezone)
        Long approvalTime = null;
        if (connection.getConnectionExecutionDate() != null) {
            approvalTime = connection.getConnectionExecutionDate();
        } else if (connection.getDateEffectiveFrom() != null) {
            approvalTime = connection.getDateEffectiveFrom();
        } else if (connection.getAuditDetails() != null && connection.getAuditDetails().getLastModifiedTime() != null) {
            approvalTime = connection.getAuditDetails().getLastModifiedTime();
        } else {
            approvalTime = System.currentTimeMillis();
        }
        ZoneId zoneId = ZoneId.of("Asia/Kolkata");
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy").withZone(zoneId);
        ZonedDateTime approvalDateTime = Instant.ofEpochMilli(approvalTime).atZone(zoneId);
        String approvalDate = approvalDateTime.format(formatter);

        String applicationNo = !StringUtils.isEmpty(connection.getApplicationNo()) 
                ? connection.getApplicationNo() 
                : connection.getConnectionNo();
        String templateName = config.getNcApplicationApprovedTemplateName();

        // 1. Zone resolution
        String zone = null;
        if (property != null && property.getAddress() != null) {
            if (!StringUtils.isEmpty(property.getAddress().getZone())) {
                zone = property.getAddress().getZone();
            } else if (property.getAddress().getLocality() != null && !StringUtils.isEmpty(property.getAddress().getLocality().getZone())) {
                zone = property.getAddress().getLocality().getZone();
            }
        }
        if (StringUtils.isEmpty(zone) && connection.getAdditionalDetails() != null) {
            try {
                Map<String, Object> addDetails = mapper.convertValue(connection.getAdditionalDetails(), Map.class);
                if (addDetails.get("zone") != null) {
                    zone = String.valueOf(addDetails.get("zone"));
                }
            } catch (Exception e) {
                log.warn("Error reading zone from additionalDetails", e);
            }
        }
        if (StringUtils.isEmpty(zone)) {
            zone = "Delhi Zone";
        } else if (!zone.toLowerCase().contains("zone")) {
            zone = zone + " Zone";
        }

        // 2. ZRO Office resolution
        String zroOffice = null;
        if (property != null && property.getAddress() != null && !StringUtils.isEmpty(property.getAddress().getZroLocation())) {
            zroOffice = property.getAddress().getZroLocation();
        }
        if (StringUtils.isEmpty(zroOffice) && connection.getAdditionalDetails() != null) {
            try {
                Map<String, Object> addDetails = mapper.convertValue(connection.getAdditionalDetails(), Map.class);
                if (addDetails.get("zro") != null) {
                    zroOffice = String.valueOf(addDetails.get("zro"));
                } else if (addDetails.get("zroLocation") != null) {
                    zroOffice = String.valueOf(addDetails.get("zroLocation"));
                }
            } catch (Exception e) {
                log.warn("Error reading zro from additionalDetails", e);
            }
        }
        if (StringUtils.isEmpty(zroOffice)) {
            zroOffice = "ZRO Delhi";
        } else if (!zroOffice.toUpperCase().contains("ZRO")) {
            zroOffice = "ZRO " + zroOffice;
        }

        // 3. Connection Type resolution (e.g. Domestic / Commercial)
        String connectionType = "Domestic";
        String category = connection.getConnectionCategory();
        if (StringUtils.isEmpty(category) && connection.getAdditionalDetails() != null) {
            try {
                Map<String, Object> addDetails = mapper.convertValue(connection.getAdditionalDetails(), Map.class);
                if (addDetails.get("propertyCategory") != null) {
                    category = String.valueOf(addDetails.get("propertyCategory"));
                }
            } catch (Exception e) {
                log.warn("Error reading propertyCategory from additionalDetails", e);
            }
        }
        if (!StringUtils.isEmpty(category)) {
            if ("COMMERCIAL".equalsIgnoreCase(category) || "NON_DOMESTIC".equalsIgnoreCase(category)) {
                connectionType = "Commercial";
            } else if ("DOMESTIC".equalsIgnoreCase(category) || "RESIDENTIAL".equalsIgnoreCase(category)) {
                connectionType = "Domestic";
            } else {
                connectionType = Character.toUpperCase(category.charAt(0)) + category.substring(1).toLowerCase();
            }
        }

        // 4. Installation Timeline (7 days after approval date)
        String installationTimeline = approvalDateTime.plusDays(7).format(formatter);

        // 5. Consent Letter / Notice Download Link (dynamic from consentFileStoreId with fallback)
        String consentFileStoreId = null;
        if (connection.getAdditionalDetails() != null) {
            Map<String, Object> addDetails = mapper.convertValue(connection.getAdditionalDetails(), Map.class);
            if (addDetails.get(WCConstants.CONSENT_LETTER_FILESTORE_ID) != null) {
                consentFileStoreId = String.valueOf(addDetails.get(WCConstants.CONSENT_LETTER_FILESTORE_ID));
            }
        }

        // If not found in additionalDetails yet, generate it via pdfFileStoreService
        if (StringUtils.isEmpty(consentFileStoreId)) {
            try {
                log.info("Attempting Consent Letter generation for application: {}", connection.getApplicationNo());
                consentFileStoreId = pdfFileStoreService.getConsentFileStoreId(request, property, WCConstants.PDF_CONSENT_KEY);
                log.info("Consent letter generated fileStoreId: {} for application: {}", consentFileStoreId, connection.getApplicationNo());
                if (!StringUtils.isEmpty(consentFileStoreId)) {
                    Map<String, Object> addDetails = (connection.getAdditionalDetails() != null)
                            ? mapper.convertValue(connection.getAdditionalDetails(), Map.class) : new HashMap<>();
                    addDetails.put(WCConstants.CONSENT_LETTER_FILESTORE_ID, consentFileStoreId);
                    connection.setAdditionalDetails(addDetails);
                }
            } catch (Exception e) {
                log.warn("Could not generate consent letter on the fly: {}", e.getMessage(), e);
            }
        }

        String consentLetterPdfUrl;
        if (!StringUtils.isEmpty(consentFileStoreId)) {
            consentLetterPdfUrl = "https://dev-djberp.nitcon.in/filestore/v1/files/id?tenantId=dl.djb&fileStoreId=" + consentFileStoreId;
        } else {
            consentLetterPdfUrl = "https://dev-djberp.nitcon.in/filestore/v1/files/id?tenantId=dl&fileStoreId=2c42cc8e-25f6-4372-a048-9eae38e7f33d";
        }

        try {
            String shortened = waterServiceUtil.getShortnerURL(consentLetterPdfUrl);
            if (!StringUtils.isEmpty(shortened)) {
                consentLetterPdfUrl = shortened;
            }
        } catch (Exception e) {
            log.warn("Failed to shorten consent letter PDF URL, using direct filestore link: {}", consentLetterPdfUrl, e);
        }

        final String finalZone = zone;
        final String finalZroOffice = zroOffice;
        final String finalConnectionType = connectionType;
        final String finalConsentLetterPdfUrl = consentLetterPdfUrl;

        List<WhatsAppRequest> whatsappRequests = new ArrayList<>();
        mobileNumbersAndNames.forEach((mobileNumber, name) -> {
            String applicantName = !StringUtils.isEmpty(name) ? name : "Citizen";
            List<String> parameters = Arrays.asList(
                    applicantName,          // {{1}}
                    applicationNo,          // {{2}}
                    finalZone,              // {{3}}
                    finalZroOffice,         // {{4}}
                    finalConnectionType,    // {{5}}
                    approvalDate,           // {{6}}
                    installationTimeline,   // {{7}} (7 days after approval date)
                    finalConsentLetterPdfUrl // {{8}} (Downloadable Consent Letter PDF link)
            );

            WhatsAppRequest req = WhatsAppRequest.builder()
                    .mobileNumber(mobileNumber)
                    .templateName(templateName)
                    .parameters(parameters)
                    .build();
            whatsappRequests.add(req);
        });

        return whatsappRequests;
    }

    /**
     * Builds WhatsApp requests for New Water Connection Activated notification.
     * Template: new_water_connection_activated
     * 
     * Template Text:
     * Dear {{1}},
     * 
     * This is to inform you that your application for a New Water Connection has been activated successfully.
     * 
     * Activation Details:
     * - Consumer Number: {{2}}
     * - Applicant Name: {{1}}
     * 
     * Thank you.
     * 
     * Delhi Jal Board
     * 
     * Parameters:
     *   {{1}} -> Citizen / Applicant Name
     *   {{2}} -> Consumer Number (Connection Number / KNO)
     * 
     * @param request WaterConnectionRequest
     * @param property Property
     * @return List of WhatsAppRequest
     */
    private List<WhatsAppRequest> getWhatsAppRequestForConnectionActivated(WaterConnectionRequest request, Property property) {
        WaterConnection connection = request.getWaterConnection();
        if (connection == null) {
            return Collections.emptyList();
        }

        Map<String, String> mobileNumbersAndNames = extractRecipientMobileNumbersAndNames(request, property, connection);
        if (CollectionUtils.isEmpty(mobileNumbersAndNames)) {
            log.info("No mobile numbers found for WhatsApp activation notification on application: {}", connection.getApplicationNo());
            return Collections.emptyList();
        }

        // 1. Consumer Number (Connection Number / KNO / Consumer No)
        String consumerNumber = connection.getConnectionNo();
        if (StringUtils.isEmpty(consumerNumber) && connection.getAdditionalDetails() != null) {
            try {
                Map<String, Object> addDetails = mapper.convertValue(connection.getAdditionalDetails(), Map.class);
                if (addDetails.get("kno") != null) {
                    consumerNumber = String.valueOf(addDetails.get("kno"));
                } else if (addDetails.get("consumerNo") != null) {
                    consumerNumber = String.valueOf(addDetails.get("consumerNo"));
                } else if (addDetails.get("connectionNo") != null) {
                    consumerNumber = String.valueOf(addDetails.get("connectionNo"));
                }
            } catch (Exception e) {
                log.warn("Error reading consumer number from additionalDetails", e);
            }
        }
        if (StringUtils.isEmpty(consumerNumber)) {
            consumerNumber = connection.getApplicationNo();
        }
        if (!StringUtils.isEmpty(consumerNumber)) {
            consumerNumber = consumerNumber.trim().replaceAll("[\\r\\n\\t]+", " ").replaceAll(" {2,}", " ");
        }

        String templateName = config.getConnectionActivatedTemplateName();
        final String finalConsumerNumber = consumerNumber;

        List<WhatsAppRequest> whatsappRequests = new ArrayList<>();
        mobileNumbersAndNames.forEach((mobileNumber, name) -> {
            String applicantName = !StringUtils.isEmpty(name) ? name : "Citizen";
            applicantName = applicantName.trim().replaceAll("[\\r\\n\\t]+", " ").replaceAll(" {2,}", " ");

            List<String> parameters = Arrays.asList(
                    applicantName,          // {{1}}
                    finalConsumerNumber     // {{2}}
            );

            WhatsAppRequest req = WhatsAppRequest.builder()
                    .mobileNumber(mobileNumber)
                    .templateName(templateName)
                    .parameters(parameters)
                    .build();
            whatsappRequests.add(req);
        });

        return whatsappRequests;
    }

}
