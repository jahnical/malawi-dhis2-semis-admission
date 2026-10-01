import React from "react";
import { format } from "date-fns";
import { useRecoilState } from "recoil";
import { TableDataRefetch } from "dhis2-semis-types";
import { Form } from "react-final-form";
import { ModalComponent, useGetUsedProgramStages, WithBorder, WithPadding, CustomForm } from "dhis2-semis-components";
import { useSaveTei, useUrlParams, useGetSectionTypeLabel, getSectionLabels } from "dhis2-semis-functions";
import useGetSelectedKeys from "../../../hooks/config/useGetSelectedKeys";
import { useConfig } from "@dhis2/app-runtime";
import { enrollmentPostBody } from "../../../utils/enrollment/formatEnrollmentPostBody";
import { useEnrollmentYearValidation, useShowAlerts } from 'dhis2-semis-functions';
import { useSchoolCalendarKey } from 'dhis2-semis-components';
import { usePlanAdmissionEnrollment } from "../../../hooks/enrollment/usePlanAdmissionEnrollment";

export interface SelectedStudent {
    trackedEntity: string;
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
    const sectionLabels = getSectionLabels(sectionName, i18n);
    const [, setRefetch] = useRecoilState(TableDataRefetch);
    const { program: programData, dataStoreData } = useGetSelectedKeys();
    const schoolCalendar = useSchoolCalendarKey();
    const enrollmentAcademicYearField = academicYearDataElement || dataStoreData.registration.academicYear || schoolCalendar?.academicYear;
    const validateYear = useEnrollmentYearValidation();
    const { show } = useShowAlerts();
    const [validating, setValidating] = React.useState(false);
    const { planAdmissionEnrollment } = usePlanAdmissionEnrollment({ academicYearDataElement: enrollmentAcademicYearField, currentAcademicYear: defaultAcademicYear });
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

    async function onSubmit(sharedValues: Record<string, any>) {
        setValidating(true);
        const enrollmentDate = sharedValues?.enrollment_date || format(new Date(), "yyyy-MM-dd");
        let prepared: Awaited<ReturnType<typeof planAdmissionEnrollment>>;
        try {
            await validateYear({ students: selectedStudents, enrollmentYear: sharedValues[enrollmentAcademicYearField], dataStore: dataStoreData, calendars: schoolCalendar?.schoolCalendar, programConfig: programData, academicYearField: enrollmentAcademicYearField, sectionType: sectionName });
        } catch {
            // The validation hook displays the error beside the Academic Year field.
            setValidating(false);
            return;
        }
        try {
            try {
                prepared = await planAdmissionEnrollment({ trackedEntities: selectedStudents.map((student) => student.trackedEntity), academicYear: sharedValues[enrollmentAcademicYearField], enrollmentDate });
            } catch {
                throw new Error("Could not check existing enrollments. Please try again.");
            }
        } catch (error: any) {
            // Not a field problem (the enrollment check failed), so show it as an alert
            show({ message: i18n.t(error.message), type: { critical: true } });
            return;
        } finally {
            setValidating(false);
        }

        // Students already registered for this year, or enrolled in a later one, are left out
        const studentsToEnroll = selectedStudents.filter((student) => !prepared.plans.get(student.trackedEntity)?.conflict);
        const skipped = selectedStudents.length - studentsToEnroll.length;
        if (skipped > 0) {
            show({
                message: i18n.t("{{count}} {{section}} skipped: already registered for this academic year or enrolled in a later one.", { count: skipped, section: sectionLabels.plural }),
                type: { warning: true },
            });
        }
        if (studentsToEnroll.length === 0) return;
        if (!prepared.calendarFound) {
            show({ message: i18n.t("The academic year is not in the school calendar. The enrollment date is used as its start date."), type: { warning: true } });
        }

        const trackedEntities = studentsToEnroll.map((student) => {
            const payload = enrollmentPostBody({
                values: sharedValues,
                orgUnitId: orgUnitId!,
                programStagesToSave,
                programId: programData?.id!,
                formVariablesFields,
                enrollmentDate,
                trackedEntityType: programData?.trackedEntityType?.id!,
                trackedEntityId: student.trackedEntity,
                plan: prepared.plans.get(student.trackedEntity)!,
                dates: prepared.dates,
            });

            return payload.trackedEntities[0];
        });

        saveTei({
            data: { trackedEntities },
            program: programData,
            messages: {
                error: i18n.t("Could not complete bulk enrollment."),
                sucess: i18n.t("{{count}} {{section}} enrolled successfully", {
                    count: studentsToEnroll.length,
                    section: sectionLabels.plural,
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
            title={i18n.t("Enroll {{count}} admitted {{section}}", {
                count: selectedStudents.length,
                section: sectionLabels.plural,
            })}
        >
            <WithPadding>
                <WithBorder type="all">
                    <WithPadding>
                        <CustomForm
                            Form={Form}
                            loading={!!loading || validating}
                            baseUrl={baseUrl}
                            withButtons={true}
                            formValues={values}
                            formFields={validateYear.withFieldError(formFields, enrollmentAcademicYearField, values[enrollmentAcademicYearField], message => i18n.t(message))}
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
