import { format } from "date-fns";
import { capitalizeString } from "dhis2-semis-functions";
import { VariablesTypes } from "dhis2-semis-types";

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

function admissionDeletionFormField({ formFieldsData, sectionName }: { formFieldsData: any[], sectionName: string }) {

  const [admissionDetails = [], studentsProfile = [], socioEconomicDetails = []] = formFieldsData;


  const updatedAdmissionData = admissionDetails.map((item: any) => {
    return { ...item, disabled: true, required: false };
  });

  const updatedDataProfile = studentsProfile
    .filter((item: any) => item?.searchable || item?.unique || item?.required)
    .map((item: any) => ({ ...item, disabled: true, required: false }));

  return [
    {
      name: `${capitalizeString(sectionName)} Profile`,
      visible: true,
      fields: [
        ...updatedDataProfile
      ]
    },
    {
      name: "Admission Details",
      visible: true,
      fields: [
        ...updatedAdmissionData,
      ]
    }
  ];
}

export { admissionDeletionFormField, staticForm };
