import React, { useState, Fragment, useEffect } from "react";
import { CardLabel, TextInput, Dropdown, UploadFile, Toast, FormStep, Loader } from "@djb25/digit-ui-react-components";
import { useLocation } from "react-router-dom";

const ConsumerDetails = ({ config, onSelect, formData }) => {
  const location = useLocation();
  const flowState = location.state || {};
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const queryParams = new URLSearchParams(location.search);
  const urlKno = queryParams.get("kno");

  const searchKno = urlKno || flowState?.kNumber || flowState?.kno || formData?.kNumber || formData?.kno || sessionStorage.getItem("EKYC_K_NUMBER") || "";

  const { isLoading, data: searchData } = Digit.Hooks.ekyc.useSearchConnection(
    { tenantId, details: { kno: searchKno } },
    { enabled: !!searchKno, cacheTime: 0 }
  );

  const savedData = formData?.consumerDetails || {};

  // 🔹 STATES
  const [kno, setKno] = useState(savedData.kno || "");
  const [consumerType, setConsumerType] = useState(
    savedData.consumerType ? { name: savedData.consumerType } : null
  );
  const [occupantType, setOccupantType] = useState(
    savedData.occupantType ? { name: savedData.occupantType } : null
  );
  const [categoryType, setCategoryType] = useState(
    savedData.categoryType ? { name: savedData.categoryType } : null
  );

  const [firstName, setFirstName] = useState(savedData.firstName || "");
  const [middleName, setMiddleName] = useState(savedData.middleName || "");
  const [lastName, setLastName] = useState(savedData.lastName || "");

  const [gender, setGender] = useState(
    savedData.gender ? { name: savedData.gender } : null
  );

  const [mobile, setMobile] = useState(savedData.mobile || "");
  const [whatsapp, setWhatsapp] = useState(savedData.whatsapp || "");
  const [email, setEmail] = useState(savedData.email || "");
  const [residents, setResidents] = useState(savedData.residents || "");

  // Tenant
  const [, setDocumentProof] = useState(null);
  const [documentId, setDocumentId] = useState(savedData.documentId || null);
  const [ownerMobile, setOwnerMobile] = useState(savedData.ownerMobile || "");
  const [tenantVerification, setTenantVerification] = useState(savedData.tenantVerification || "");

  // Govt
  const [designation, setDesignation] = useState(savedData.designation || "");
  const [department, setDepartment] = useState(savedData.department || "");
  const [employeeId, setEmployeeId] = useState(savedData.employeeId || "");

  // Other Entity
  const [contactPerson, setContactPerson] = useState(savedData.contactPerson || "");
  const [entityName, setEntityName] = useState(savedData.entityName || "");

  // Identity

  const [toast, setToast] = useState(null);

  // 🔹 OPTIONS
  const consumerTypeOptions = [{ name: "Individual" }, { name: "Govt" }, { name: "Company_Society_Org" }];

  const occupantOptions = [{ name: "Self" }, { name: "Tenanted" }];

  const genderOptions = [{ name: "Male" }, { name: "Female" }, { name: "Others" }, { name: "Not prefer to say" }];

  // 🔹 PREFILL FROM SEARCH DATA
  useEffect(() => {
    const rawData = searchData || formData?.connectionDetails;
    const details = rawData?.connectionDetails || rawData || {};

    if (searchKno && !kno) {
      setKno(searchKno);
    }

    if (details && Object.keys(details).length > 0 && !savedData.firstName) {
      if (details.consumerName) {
        const nameParts = details.consumerName.trim().split(/\s+/);
        if (nameParts.length > 0) setFirstName(nameParts[0]);
        if (nameParts.length > 2) {
          setMiddleName(nameParts.slice(1, -1).join(" "));
          setLastName(nameParts[nameParts.length - 1]);
        } else if (nameParts.length === 2) {
          setLastName(nameParts[1]);
        }
      }
      if (details.phoneNumber) {
        setMobile(details.phoneNumber);
      }
      if (details.email) {
        setEmail(details.email);
      }
    }
  }, [searchData, formData?.connectionDetails, searchKno]);

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

    return true;
  };

  // 🔹 SUBMIT
  const onStepSelect = () => {
    if (!isValid()) {
      setToast({ type: "error", message: "Fill required fields" });
      return;
    }

    const data = {
      kno,
      consumerType: consumerType?.name,
      occupantType: occupantType?.name,
      categoryType: categoryType?.name,
      firstName,
      middleName,
      lastName,
      gender: gender?.name,
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
      contactPerson,
      entityName,
    };

    onSelect(config.key, data);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Fragment>
      <FormStep onSelect={onStepSelect} config={config}>
        <div>
          <CardLabel>K Number *</CardLabel>
          <TextInput value={kno} onChange={(e) => setKno(e.target.value)} />
        </div>

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

        {toast && <Toast label={toast.message} error={toast.type === "error"} onClose={() => setToast(null)} />}
      </FormStep>
    </Fragment>
  );
};

export default ConsumerDetails;
