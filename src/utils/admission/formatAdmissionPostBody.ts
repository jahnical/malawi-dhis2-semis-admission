interface admissionPostBodyInterface {
    programId: string,
    orgUnitId: string,
    admissionDate: string
    trackedEntityId?: string,
    trackedEntityType: string,
    formVariablesFields: any[],
    values: Record<string, any>,
}

export const admissionPostBody = ({ formVariablesFields, programId, orgUnitId, admissionDate, trackedEntityType, trackedEntityId, values }: admissionPostBodyInterface) => {
    const attributes: { attribute: string; value: any }[] = [];

    for (const group of formVariablesFields) {
        if (group?.[0]?.type === "attribute") {
            group.forEach((attr: { id: string }) => {
                if (values[attr.id]) {
                    attributes.push({ attribute: attr.id, value: values[attr.id] });
                }
            });
        }
    }

    return {
        trackedEntities: [
            {
                orgUnit: orgUnitId,
                trackedEntityType,
                ...(trackedEntityId ? { trackedEntity: trackedEntityId } : {}),
                enrollments: [
                    {
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
