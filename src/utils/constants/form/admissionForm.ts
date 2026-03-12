import { format } from "date-fns";
import { VariablesTypes } from "dhis2-semis-types";
import { capitalizeString } from "dhis2-semis-functions";

const staticForm = () => {
  return {
    registeringSchool: {
      required: true,
      name: "registerschoolstaticform",
      labelName: "Registering School",
      valueType: "TEXT",
      options: undefined,
      disabled: true,
      pattern: "",
      visible: true,
      description: "Registering School",
      searchable: false,
      error: false,
      programStage: "",
      content: "",
      id: "registerschoolstaticform",
      displayName: "Registering School",
      header: "Registering School",
      type: VariablesTypes.DataElement,
      assignedValue: undefined
    },
    admissionDate: {
      required: true,
      name: "admission_date",
      labelName: "Admission date",
      valueType: "DATE",
      options: undefined,
      disabled: false,
      pattern: "",
      visible: true,
      description: "Admission date",
      searchable: false,
      error: false,
      programStage: "",
      content: "",
      id: "admission_date",
      displayName: "Admission date",
      header: "Admission date",
      type: VariablesTypes.DataElement,
      assignedValue: format(new Date(), "yyyy-MM-dd")
    }
  }
}

function formFields({ formFieldsData, sectionName, admissionDateAttributeId, studentIdentifierAttributeId }: { formFieldsData: any[], sectionName: string, admissionDateAttributeId?: string, studentIdentifierAttributeId?: string }) {

  const [studentAttributes = []] = formFieldsData;

  // If a configured admission date attribute exists, use it in Admission Details
  // and remove it from Student Profile to avoid duplication
  const configuredAdmissionDateAttr = admissionDateAttributeId
    ? studentAttributes.find((attr: any) => attr.id === admissionDateAttributeId)
    : null;

  const admissionDateField = configuredAdmissionDateAttr
    ? { ...configuredAdmissionDateAttr, labelName: "Admission date", displayName: "Admission date", header: "Admission date", name: configuredAdmissionDateAttr.id }
    : staticForm().admissionDate;

  const filteredStudentAttributes = configuredAdmissionDateAttr
    ? studentAttributes.filter((attr: any) => attr.id !== admissionDateAttributeId)
    : studentAttributes;

  // For the configured student identifier attribute, make it editable (not disabled)
  // so the user can type a value. If left empty, the system will auto-generate on submit.
  const processedAttributes = studentIdentifierAttributeId
    ? filteredStudentAttributes.map((attr: any) =>
        attr.id === studentIdentifierAttributeId
          ? { ...attr, disabled: false }
          : attr
      )
    : filteredStudentAttributes;

  return [
    {
      name: "Admission Details",
      description: "Details related to the admission process",
      visible: true,
      fields: [
        staticForm().registeringSchool,
        admissionDateField
      ]
    },
    {
      name: `${capitalizeString(sectionName)} Profile`,
      description: `${capitalizeString(sectionName)} personal details`,
      visible: true,
      fields: [
        ...processedAttributes
      ]
    }
  ];
}

export { formFields, staticForm };