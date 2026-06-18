import React, { useState, Fragment, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CardLabel, TextInput, Dropdown, UploadFile, RadioButtons, Toast, FormStep, Loader, CheckBox } from "@djb25/digit-ui-react-components";
const AadhaarVerification = ({ config, onSelect, formData }) => {
  const location = useLocation();
  const flowState = location.state || {};

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const searchKno = flowState?.kNumber || flowState?.kno || formData?.kNumber || formData?.kno || sessionStorage.getItem("EKYC_K_NUMBER");

  const { isLoading, data: searchData } = Digit.Hooks.ekyc.useSearchConnection(
    { tenantId, details: { kno: searchKno } },
    { enabled: !!searchKno, cacheTime: 0 }
  );

  const updateMutation = Digit.Hooks.ekyc.useEkycUpdate(tenantId);

  const savedData = formData?.aadhaarVerification || {};

  // 🔹 STATES
  const [kno, setKno] = useState(savedData.kno || searchKno || "");
  const [consumerType, setConsumerType] = useState(savedData.consumerType ? { name: savedData.consumerType } : null);
  const [occupantType, setOccupantType] = useState(savedData.occupantType ? { name: savedData.occupantType } : null);
  const [categoryType, setCategoryType] = useState(savedData.categoryType ? { name: savedData.categoryType } : null);

  const [consumerName, setConsumerName] = useState(savedData.consumerName || "");
  const [firstName, setFirstName] = useState(savedData.firstName || "");
  const [middleName, setMiddleName] = useState(savedData.middleName || "");
  const [lastName, setLastName] = useState(savedData.lastName || "");

  const [gender, setGender] = useState(savedData.gender ? { name: savedData.gender } : null);
  const [parentSpouseName, setParentSpouseName] = useState(savedData.parentSpouseName || "");
  const [relation, setRelation] = useState(savedData.relation || "");

  const [mobile, setMobile] = useState(savedData.mobile || "");
  const [whatsapp, setWhatsapp] = useState(savedData.whatsapp || "");
  const [email, setEmail] = useState(savedData.email || "");
  const [residents, setResidents] = useState(savedData.residents || "");

  // Tenant
  const [documentProof, setDocumentProof] = useState(savedData.documentProof || null);
  const [documentId, setDocumentId] = useState(savedData.documentId || null);
  const [ownerMobile, setOwnerMobile] = useState(savedData.ownerMobile || "");
  const [tenantVerification, setTenantVerification] = useState(savedData.tenantVerification || "");

  // Govt
  const [designation, setDesignation] = useState(savedData.designation || "");
  const [department, setDepartment] = useState(savedData.department || "");
  const [employeeId, setEmployeeId] = useState(savedData.employeeId || "");
  const [landline, setLandline] = useState(savedData.landline || "");

  // Other Entity
  const [entityRelation, setEntityRelation] = useState(savedData.entityRelation || "");
  const [contactPerson, setContactPerson] = useState(savedData.contactPerson || "");
  const [entityName, setEntityName] = useState(savedData.entityName || "");

  // Identity
  const [idProof, setIdProof] = useState(savedData.idProof ? { name: savedData.idProof } : null);
  const [idNumber, setIdNumber] = useState(savedData.idNumber || "");
  const [documentNumber, setDocumentNumber] = useState(savedData.documentNumber || "");
  const [identityType, setIdentityType] = useState(savedData.identityType ? { name: savedData.identityType } : null);
  const [idFile, setIdFile] = useState(savedData.idFile || null);

  // Consent
  const [consent, setConsent] = useState(savedData.consent || false);
  const [informantIsConsumer, setInformantIsConsumer] = useState(savedData.informantIsConsumer ?? true);
  const [informantName, setInformantName] = useState(savedData.informantName || "");
  const [informantRelation, setInformantRelation] = useState(savedData.informantRelation || "");

  const [toast, setToast] = useState(null);

  useEffect(() => {
    const rawData = searchData || formData?.connectionDetails;
    const details = rawData?.connectionDetails || rawData || {};
    const addrDetails = rawData?.addressDetails || {};

    if (details && Object.keys(details).length > 0 && !savedData.firstName) {
      if (!kno && searchKno) setKno(searchKno);

      if (details.firstName) {
        setFirstName(details.firstName);
        if (details.middleName) setMiddleName(details.middleName);
        if (details.lastName) setLastName(details.lastName);
      } else if (details.consumerName) {
        setConsumerName(details.consumerName);
        const parts = details.consumerName.trim().split(/\s+/);
        setFirstName(parts[0] || "");
        if (parts.length === 2) setLastName(parts[1]);
        if (parts.length > 2) {
          setMiddleName(parts.slice(1, -1).join(" "));
          setLastName(parts[parts.length - 1]);
        }
      }

      if (details.phoneNumber || addrDetails.mobileNo) setMobile(details.phoneNumber || addrDetails.mobileNo);
      if (details.email || addrDetails.email) setEmail(details.email || addrDetails.email);
      if (addrDetails.whatsappNo) setWhatsapp(addrDetails.whatsappNo);
      if (addrDetails.noOfPerson) setResidents(String(addrDetails.noOfPerson));

      if (details.consumerType) setConsumerType({ name: details.consumerType });
      if (details.occupantType) setOccupantType({ name: details.occupantType });
      if (details.gender) setGender({ name: details.gender });
      if (details.parentSpouse) setParentSpouseName(details.parentSpouse);
      if (details.documentNumber) {
        setDocumentId(details.documentNumber);
        setIdNumber(details.documentNumber);
      }
      if (details.informantName) setInformantName(details.informantName);
      if (details.informantRelation) setInformantRelation(details.informantRelation);
    }
  }, [searchData, formData?.connectionDetails, searchKno]);

  // 🔹 OPTIONS
  const consumerTypeOptions = [{ name: "Individual" }, { name: "Govt" }, { name: "Company_Society_Org" }];

  const occupantOptions = [{ name: "Self" }, { name: "Tenanted" }];

  const genderOptions = [{ name: "Male" }, { name: "Female" }, { name: "Others" }, { name: "Not prefer to say" }];

  const identityTypeOptions = [{ name: "Aadhaar Card" }, { name: "Driving License" }, { name: "Passport" }, { name: "Voter ID" }];

  const yesNo = [{ name: "Yes" }, { name: "No" }];

  // 🔹 FILE UPLOAD
  const uploadFile = async (e, setter, idSetter) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await Digit.UploadServices.Filestorage("EKYC", file);
      const id = res?.data?.files?.[0]?.fileStoreId;
      if (id) {
        setter(file.name);
        idSetter(id);
      }
    } catch {
      setToast({ type: "error", message: "Upload failed" });
    }
  };

  // 🔹 VALIDATION
  const isValid = () => {
    if (!kno) return false;
    if (!consumerType) return false;
    if (!occupantType) return false;
    if (!categoryType) return false;
    if (!firstName) return false;
    if (!mobile) return false;
    if (!residents || Number(residents) <= 0) return false;

    if (occupantType?.name === "Tenanted" && !documentId && !ownerMobile) return false;

    return consent; // consent must be true
  };

  // 🔹 SUBMIT
  const onStepSelect = async () => {
    // If not valid, just show a warning (or uncomment below to enforce)
    /*
    if (!isValid()) {
      setToast({ type: "error", message: "Fill required fields" });
      return;
    }
    */

    const data = {
      kno,
      consumerType: consumerType?.name,
      occupantType: occupantType?.name,
      categoryType: categoryType?.name,
      consumerName,
      firstName,
      middleName,
      lastName,
      gender: gender?.name,
      parentSpouseName,
      relation,
      mobile,
      whatsapp,
      email,
      residents,
      documentId,
      ownerMobile,
      tenantVerification,
      designation,
      department,
      employeeId,
      landline,
      entityRelation,
      contactPerson,
      entityName,
      idProof: idProof?.name,
      idNumber,
      consent,
      informantIsConsumer,
      informantName,
      informantRelation,
    };

    try {
      await updateMutation.mutateAsync({
        RequestInfo: {},
        updateType: "CONSUMER",
        ...data,
      });
      setToast({ type: "success", message: "Data updated successfully!" });
      onSelect(config.key, data);
    } catch (error) {
      setToast({ type: "error", message: "Failed to update consumer details" });
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Fragment>
      <FormStep onSelect={onStepSelect} config={config} isDisabled={!isValid()}>
        <div>
          <CardLabel>Consumer Type *</CardLabel>
          <Dropdown option={consumerTypeOptions} selected={consumerType} select={setConsumerType} />
        </div>

        <div>
          <CardLabel>Occupant Type *</CardLabel>
          <Dropdown option={occupantOptions} selected={occupantType} select={setOccupantType} />
        </div>

        <div>
          <CardLabel>Category Type *</CardLabel>
          <Dropdown option={[]} selected={categoryType} select={setCategoryType} />
        </div>

        <div>
          <CardLabel>First Name *</CardLabel>
          <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>

        <div>
          <CardLabel>Middle Name</CardLabel>
          <TextInput value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
        </div>

        <div>
          <CardLabel>Last Name</CardLabel>
          <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>

        <div>
          <CardLabel>Gender</CardLabel>
          <Dropdown option={genderOptions} selected={gender} select={setGender} />
        </div>

        <div>
          <CardLabel>Parent/Spouse Name </CardLabel>
          <TextInput value={parentSpouseName} onChange={(e) => setParentSpouseName(e.target.value)} />
        </div>

        <div>
          <CardLabel>Mobile *</CardLabel>
          <TextInput value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </div>

        <div>
          <CardLabel>WhatsApp</CardLabel>
          <TextInput value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>

        <div>
          <CardLabel>Email</CardLabel>
          <TextInput value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <CardLabel>No. of Residents *</CardLabel>
          <TextInput value={residents} onChange={(e) => setResidents(e.target.value)} />
        </div>
        <div>
          <CardLabel>Type of Identity *</CardLabel>
          <Dropdown option={identityTypeOptions} selected={identityType} select={setIdentityType} />
        </div>
        <div>
          <CardLabel>Proof of Identity</CardLabel>
          <UploadFile onUpload={(e) => uploadFile(e, setDocumentProof, setDocumentId)} />
        </div>
        <div>
          <CardLabel>Document Number</CardLabel>
          <TextInput value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
        </div>

        <div>
          <CardLabel>Informant Is Consumer</CardLabel>
          <CheckBox
            label="Yes, the informant is the consumer"
            checked={informantIsConsumer}
            onChange={(e) => setInformantIsConsumer(e.target.checked)}
          />
        </div>

        {!informantIsConsumer && (
          <Fragment>
            <div>
              <CardLabel>Informant Name</CardLabel>
              <TextInput value={informantName} onChange={(e) => setInformantName(e.target.value)} />
            </div>
            <div>
              <CardLabel>Informant Relation</CardLabel>
              <TextInput value={informantRelation} onChange={(e) => setInformantRelation(e.target.value)} />
            </div>
          </Fragment>
        )}

        {/* TENANT LOGIC */}
        {occupantType?.name === "Tenanted" && (
          <Fragment>
            <div>
              <CardLabel>Document Proof</CardLabel>
              <UploadFile onUpload={(e) => uploadFile(e, setDocumentProof, setDocumentId)} />
            </div>

            {!documentId && (
              <Fragment>
                <div>
                  <CardLabel>Owner Mobile *</CardLabel>
                  <TextInput value={ownerMobile} onChange={(e) => setOwnerMobile(e.target.value)} />
                </div>

                <div>
                  <CardLabel>Tenant Verification</CardLabel>
                  <TextInput value={tenantVerification} onChange={(e) => setTenantVerification(e.target.value)} />
                </div>
              </Fragment>
            )}
          </Fragment>
        )}

        {/* GOVT */}
        {consumerType?.name === "Govt" && (
          <Fragment>
            <div>
              <CardLabel>Designation</CardLabel>
              <TextInput value={designation} onChange={(e) => setDesignation(e.target.value)} />
            </div>

            <div>
              <CardLabel>Department</CardLabel>
              <TextInput value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>

            <div>
              <CardLabel>Employee ID</CardLabel>
              <TextInput value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
            </div>
          </Fragment>
        )}

        {/* OTHER ENTITY */}
        {consumerType?.name === "Company_Society_Org" && (
          <Fragment>
            <div>
              <CardLabel>Entity Name</CardLabel>
              <TextInput value={entityName} onChange={(e) => setEntityName(e.target.value)} />
            </div>

            <div>
              <CardLabel>Contact Person</CardLabel>
              <TextInput value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            </div>
          </Fragment>
        )}
      </FormStep>
      {toast && <Toast error={toast.type === "error"} label={toast.message} onClose={() => setToast(null)} />}
    </Fragment>
  );
};

export default AadhaarVerification;
