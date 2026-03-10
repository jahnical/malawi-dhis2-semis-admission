interface admissionUpdateBodyInterface {
    programId: string,
    orgUnitId: string,
    admissionDate: string,
    trackedEntityId: string,
    trackedEntityType: string,
    formValues: Record<string, any>,
    admissionId: string,
    formVariablesFields: any[],
}

export const admissionUpdateBody = ({ formVariablesFields, admissionId, admissionDate, trackedEntityId, trackedEntityType, orgUnitId, programId, formValues }: admissionUpdateBodyInterface): any => {
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

    return {
        trackedEntities: [
            {
                orgUnit: orgUnitId,
                trackedEntity: trackedEntityId,
                trackedEntityType,
                enrollments: [
                    {
                        enrollment: admissionId,
                        orgUnit: orgUnitId,
                        program: programId,
                        status: "ACTIVE",
                        attributes,
                        occurredAt: admissionDate,
                        enrolledAt: admissionDate,
                    }
                ]
            }
        ]
    }
}
