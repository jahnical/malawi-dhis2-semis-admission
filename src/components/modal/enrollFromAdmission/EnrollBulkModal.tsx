import React from "react";
import { format } from "date-fns";
import { useRecoilState } from "recoil";
import { TableDataRefetch } from "dhis2-semis-types";
import { Form } from "react-final-form";
import { ModalComponent, useGetUsedProgramStages, WithBorder, WithPadding, CustomForm } from "dhis2-semis-components";
import { useSaveTei, useUrlParams, useGetSectionTypeLabel } from "dhis2-semis-functions";
import useGetSelectedKeys from "../../../hooks/config/useGetSelectedKeys";
import { useConfig } from "@dhis2/app-runtime";
import { enrollmentPostBody } from "../../../utils/enrollment/formatEnrollmentPostBody";

export interface SelectedStudent {
    trackedEntity: string;
    enrollmentId?: string;
    activeEnrollmentToComplete?: string;
    activeEnrollmentEnrolledAt?: string;
    attributes: { attribute: string; value: any }[];
}

interface EnrollBulkModalProps {
    i18n: any;
    open: boolean;
    setOpen: (open: boolean) => void;
    selectedStudents: SelectedStudent[];
    formFields?: any;
    formVariablesFields?: any[];
    defaultAcademicYear?: string;
    academicYearDataElement?: string;
}

function EnrollBulkModal({
    i18n,
    open,
    setOpen,
    selectedStudents,
    formFields = [],
    formVariablesFields = [],
    defaultAcademicYear,
    academicYearDataElement,
}: EnrollBulkModalProps) {
    const { baseUrl } = useConfig();
    const { urlParameters } = useUrlParams();
    const { school: orgUnitId, schoolName } = urlParameters;
    const { saveTei, loading } = useSaveTei();
    const { sectionName } = useGetSectionTypeLabel();
    const [, setRefetch] = useRecoilState(TableDataRefetch);
    const { program: programData } = useGetSelectedKeys();
    const programStagesToSave = useGetUsedProgramStages({ sectionType: sectionName });

    const defaultInitialValues: Record<string, any> = {
        orgUnit: orgUnitId,
        registerschoolstaticform: schoolName,
        enrollment_date: format(new Date(), "yyyy-MM-dd"),
    };

    const [values, setValues] = React.useState<Record<string, any>>({ ...defaultInitialValues });

    const handleClose = () => setOpen(false);

    const handleChange = (_e: { field: any; value: string; name: string }) => {
        // Handled by CustomForm / react-final-form
    };

    function onSubmit(sharedValues: Record<string, any>) {
        const enrollmentDate = sharedValues?.enrollment_date || format(new Date(), "yyyy-MM-dd");

        const trackedEntities = selectedStudents.map((student) => {
            const payload = enrollmentPostBody({
                values: sharedValues,
                orgUnitId: orgUnitId!,
                programStagesToSave,
                programId: programData?.id!,
                formVariablesFields,
                enrollmentDate,
                trackedEntityType: programData?.trackedEntityType?.id!,
                trackedEntityId: student.trackedEntity,
                enrollmentId: student.enrollmentId,
                activeEnrollmentToComplete: student.activeEnrollmentToComplete,
                activeEnrollmentEnrolledAt: student.activeEnrollmentEnrolledAt,
                defaultAcademicYear,
                academicYearDataElement,
            });

            return payload.trackedEntities[0];
        });

        saveTei({
            data: { trackedEntities },
            messages: {
                error: i18n.t("Could not complete bulk enrollment."),
                sucess: i18n.t("{{count}} {{section}}s enrolled successfully", {
                    count: selectedStudents.length,
                    section: i18n.t(sectionName),
                }),
            },
            handleComplete: () => {
                setRefetch((prev: boolean) => !prev);
                handleClose();
            },
        });
    }

    return (
        <ModalComponent
            open={open}
            handleClose={handleClose}
            loading={!!loading}
            title={i18n.t("Enroll {{count}} Admitted {{section}}s", {
                count: selectedStudents.length,
                section: i18n.t(sectionName),
            })}
        >
            <WithPadding>
                <WithBorder type="all">
                    <WithPadding>
                        <CustomForm
                            Form={Form}
                            loading={!!loading}
                            baseUrl={baseUrl}
                            withButtons={true}
                            formValues={values}
                            formFields={formFields}
                            onInputChange={handleChange}
                            setFormValues={setValues}
                            initialValues={defaultInitialValues}
                            onCancel={handleClose}
                            onFormSubtmit={(formValues: Record<string, any>) => onSubmit(formValues)}
                        />
                    </WithPadding>
                </WithBorder>
            </WithPadding>
        </ModalComponent>
    );
}

export default EnrollBulkModal;
