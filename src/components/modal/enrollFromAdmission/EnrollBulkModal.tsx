import React from "react";
import { format } from "date-fns";
import { useRecoilState } from "recoil";
import { TableDataRefetch } from "dhis2-semis-types";
import { ModalComponent, useGetUsedProgramStages } from "dhis2-semis-components";
import { useSaveTei, useUrlParams, useGetSectionTypeLabel } from "dhis2-semis-functions";
import useGetSelectedKeys from "../../../hooks/config/useGetSelectedKeys";
import { Button, ButtonStrip } from "@dhis2/ui";

export interface SelectedStudent {
    trackedEntity: string;
    enrollmentId: string;
    attributes: { attribute: string; value: any }[];
}

interface EnrollBulkModalProps {
    i18n: any;
    open: boolean;
    setOpen: (open: boolean) => void;
    selectedStudents: SelectedStudent[];
}

function EnrollBulkModal({ i18n, open, setOpen, selectedStudents }: EnrollBulkModalProps) {
    const { urlParameters } = useUrlParams();
    const { school: orgUnitId } = urlParameters;
    const { saveTei, loading } = useSaveTei();
    const { sectionName } = useGetSectionTypeLabel();
    const [, setRefetch] = useRecoilState(TableDataRefetch);
    const { program: programData } = useGetSelectedKeys();
    const programStagesToSave = useGetUsedProgramStages({ sectionType: sectionName });

    const handleClose = () => setOpen(false);

    function onSubmit() {
        const enrollmentDate = format(new Date(), "yyyy-MM-dd");

        const trackedEntities = selectedStudents.map(student => ({
            trackedEntity: student.trackedEntity,
            trackedEntityType: programData?.trackedEntityType?.id,
            orgUnit: orgUnitId,
            enrollments: [{
                enrollment: student.enrollmentId,
                orgUnit: orgUnitId,
                program: programData?.id,
                status: "COMPLETED",
                events: programStagesToSave
                    .filter((ps): ps is string => ps !== undefined)
                    .map(programStage => ({
                        orgUnit: orgUnitId,
                        notes: [],
                        status: "ACTIVE",
                        program: programData?.id,
                        occurredAt: enrollmentDate,
                        scheduledAt: enrollmentDate,
                        programStage,
                        dataValues: [],
                    })),
                attributes: student.attributes,
                occurredAt: enrollmentDate,
                enrolledAt: enrollmentDate,
            }]
        }));

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
            <div style={{ padding: "16px" }}>
                <p>
                    {i18n.t(
                        "You are about to enroll {{count}} admitted {{section}}(s). This will mark their admission as complete.",
                        {
                            count: selectedStudents.length,
                            section: i18n.t(sectionName),
                        }
                    )}
                </p>
                <ButtonStrip>
                    <Button
                        primary
                        onClick={onSubmit}
                        loading={!!loading}
                        disabled={selectedStudents.length === 0}
                    >
                        {i18n.t("Enroll {{count}} {{section}}s", {
                            count: selectedStudents.length,
                            section: i18n.t(sectionName),
                        })}
                    </Button>
                    <Button onClick={handleClose}>
                        {i18n.t("Cancel")}
                    </Button>
                </ButtonStrip>
            </div>
        </ModalComponent>
    );
}

export default EnrollBulkModal;
