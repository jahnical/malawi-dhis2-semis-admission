import { keepEnrollmentFields, type ExistingEnrollment } from "dhis2-semis-functions";

interface admissionUpdateBodyInterface {
    programId: string,
    orgUnitId: string,
    admissionDate: string,
    trackedEntityId: string,
    trackedEntityType: string,
    formValues: Record<string, any>,
    admissionId: string,
    formVariablesFields: any[],
    // The enrollment as saved (status, org unit, dates, events)
    existingEnrollment: ExistingEnrollment,
    registrationStage: string,
}

export const admissionUpdateBody = ({ formVariablesFields, admissionId, admissionDate, trackedEntityId, trackedEntityType, orgUnitId, programId, formValues, existingEnrollment, registrationStage }: admissionUpdateBodyInterface): any => {
    const attributes: { attribute: string; value: any }[] = [];

    for (const data of formVariablesFields) {
        if (!data || !data.length) continue;

        if (data[0]?.type === "attribute") {
            data.forEach((attribute: { id: string }) => {
                const value = formValues[attribute.id];
                if (value !== null && value !== undefined) {
                    attributes.push({ attribute: attribute.id, value });
                }
            });
        }
    }

    // Editing the admission never changes the enrollment status or org unit. Its dates follow the admission
    // date only while it is admission-only; once enrolled they belong to the academic year.
    const admissionOnly = !(existingEnrollment.events ?? []).some((event) => event.programStage === registrationStage && !event.deleted);
    const admissionDateChanged = Boolean(admissionDate) && admissionDate.slice(0, 10) !== existingEnrollment.enrolledAt?.slice(0, 10);

    return {
        trackedEntities: [
            {
                orgUnit: orgUnitId,
                trackedEntity: trackedEntityId,
                trackedEntityType,
                enrollments: [
                    {
                        enrollment: admissionId,
                        program: programId,
                        ...keepEnrollmentFields(existingEnrollment),
                        ...(admissionOnly && admissionDateChanged ? { enrolledAt: admissionDate, occurredAt: admissionDate } : {}),
                        attributes,
                    }
                ]
            }
        ]
    }
}
