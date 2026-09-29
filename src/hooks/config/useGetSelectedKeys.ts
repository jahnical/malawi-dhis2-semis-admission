import { useDataStoreKey, useProgramsKeys } from "dhis2-semis-components";

export default function useGetSelectedKeys() {
    const programsValues = useProgramsKeys();
    // Admission is a student-only feature; staff config has no admission section
    const dataStoreData = useDataStoreKey({ sectionType: "student" });

    return {
        dataStoreData,
        program: programsValues?.find((program) => program?.id == dataStoreData?.program)
    }
}
