import { useRecoilValue } from 'recoil';
import React, { useEffect, useMemo, useState } from "react";
import { IconEdit24, IconAddCircle24, Tag } from "@dhis2/ui";
import { Table, InfoPage, useSchoolCalendarKey } from "dhis2-semis-components";
import ModalManager from "../../components/modal/saveAdmission/ModalManager";
import EnrollSingleModal from "../../components/modal/enrollFromAdmission/EnrollSingleModal";
import { TableDataRefetch, Modules, ProgramConfig, D2I18n, VariablesTypes, CustomAttributeProps } from "dhis2-semis-types"
import useGetSelectedProgram from '../../hooks/config/useGetSelectedKeys';
import ModalManagerAdmissionDelete from '../../components/modal/deleteAdmission/ModalManager';
import { useBuildForm, useHeader, useTableData, useUrlParams, useViewPortWidth } from "dhis2-semis-functions";
import AdmissionActionsButtons from "../../components/admissionButtons/AdmissionActionsButtons";
import { formFields } from '../../utils/constants/form/admissionForm';
import { enrollmentFormFields } from '../../utils/constants/form/enrollmentForm';

export default function AdmissionsPage({ i18n, baseUrl }: { i18n: D2I18n, baseUrl: string }) {
    const { viewPortWidth } = useViewPortWidth()
    const { urlParameters, add, remove } = useUrlParams()
    const { program, dataStoreData } = useGetSelectedProgram()
    const schoolCalendar = useSchoolCalendarKey()
    const { academicYear, school, schoolName, sectionType } = urlParameters
    const [openEditModal, setOpenEditModal] = useState<boolean>(false)
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false)
    const [openEnrollModal, setOpenEnrollModal] = useState<boolean>(false)
    const [enrollStudentData, setEnrollStudentData] = useState<{ trackedEntityId: string; enrollmentId: string; activeEnrollmentToComplete: string; activeEnrollmentEnrolledAt: string; initialValues: Record<string, any> }>({ trackedEntityId: "", enrollmentId: "", activeEnrollmentToComplete: "", activeEnrollmentEnrolledAt: "", initialValues: {} })
    const { getData, tableData, loading } = useTableData({ module: Modules.Admission });
    const [filterState, setFilterState] = useState<{ dataElements: any, attributes: any }>({ attributes: [], dataElements: [] });
    const refetch = useRecoilValue(TableDataRefetch);
    const [pagination, setPagination] = useState<any>({ page: 1, pageSize: 50, totalPages: 0, totalElements: 0 })
    const { columns } = useHeader({ dataStoreData, programConfigData: program as unknown as ProgramConfig, programStage: "" });
    const { formData } = useBuildForm({ dataStoreData, programData: program, module: Modules.Admission, schoolCalendar });
    const { formData: enrollFormData } = useBuildForm({ dataStoreData, programData: program, module: Modules.Enrollment, schoolCalendar });
    const admissionFormFields = formFields({ formFieldsData: formData, sectionName: sectionType!, admissionDateAttributeId: dataStoreData?.admission?.addmissionDate })
    const enrollFormFields = enrollmentFormFields({ formFieldsData: enrollFormData, sectionName: sectionType! })

    // Customize admission table columns:
    // - Remove section and filter data element columns (stream/class)
    // - Rename grade column to "Current Standard"
    // - Add "Enrollment Status" custom column
    const admissionColumns = useMemo(() => {
        if (!columns || !dataStoreData) return columns;

        const sectionId = dataStoreData?.registration?.section;
        const academicYearId = dataStoreData?.registration?.academicYear;
        const filterDataElementIds = dataStoreData?.filters?.dataElements?.map((f: any) => f.dataElement) ?? [];
        const admissionDateId = dataStoreData?.admission?.addmissionDate;
        const columnsToRemove = [sectionId, academicYearId, ...filterDataElementIds].filter(Boolean);

        const enrollmentStatusColumn: CustomAttributeProps = {
            id: "hasActiveEnrollment",
            displayName: "Enrollment Status",
            header: "Enrollment Status",
            name: "Enrollment Status",
            labelName: "Enrollment Status",
            required: false,
            valueType: "TEXT" as unknown as CustomAttributeProps["valueType"],
            visible: true,
            disabled: false,
            pattern: "",
            searchable: false,
            error: false,
            content: "",
            key: "hasActiveEnrollment",
            type: VariablesTypes.Custom
        };

        const gradeId = dataStoreData?.registration?.grade;

        const filtered = columns
            .filter((col: CustomAttributeProps) => !columnsToRemove.includes(col.id))
            .map((col: CustomAttributeProps) => {
                if (col.id === gradeId) {
                    return { ...col, displayName: "Current Standard", header: "Current Standard", name: "Current Standard", labelName: "Current Standard" };
                }
                // Ensure admission date column is always visible
                if (admissionDateId && col.id === admissionDateId) {
                    return { ...col, visible: true, displayName: "Admission Date", header: "Admission Date", name: "Admission Date", labelName: "Admission Date" };
                }
                return col;
            });

        return [...filtered, enrollmentStatusColumn];
    }, [columns, dataStoreData]);

    const handleOpenModal = (e: Record<string, any>, type: "edit" | "delete",) => {
        add("trackedEntity", e?.row?.trackedEntity);
        add("admission", e?.row?.enrollmentId);

        if (type === "delete") {
            setOpenDeleteModal(true)
        } else {
            setOpenEditModal(true)
        }
    };

    const handleOpenEnrollModal = (e: Record<string, any>) => {
        const row = e?.row;
        // Pre-fill with TEI attribute values from the row
        const attributeFields = formData?.[0] ?? [];
        const prefilledValues: Record<string, any> = {};
        attributeFields.forEach((f: any) => {
            if (f.type === "attribute" && row?.[f.id] !== undefined) {
                prefilledValues[f.id] = row[f.id];
            }
        });
        // enrollableEnrollmentId: set when TEI has 1 ACTIVE enrollment with no events
        //   -> UPDATE existing enrollment directly
        // activeEnrollmentToComplete: set when TEI has an ACTIVE enrollment WITH events
        //   -> COMPLETE old + CREATE new enrollment in one payload
        setEnrollStudentData({
            trackedEntityId: row?.trackedEntity,
            enrollmentId: row?.enrollableEnrollmentId ?? "",
            activeEnrollmentToComplete: row?.activeEnrollmentToComplete ?? "",
            activeEnrollmentEnrolledAt: row?.activeEnrollmentEnrolledAt ?? "",
            initialValues: prefilledValues
        });
        setOpenEnrollModal(true);
    };

    useEffect(() => {
        setPagination((prev: any) => ({ ...prev, totalPages: tableData?.pagination?.totalPages, totalElements: tableData?.pagination?.totalElements }))
    }, [tableData])

    useEffect(() => {
        if (!openDeleteModal && !openEditModal) {
            remove("trackedEntity")
            remove("admission")
        }
    }, [openDeleteModal, openEditModal])

    const rowsActions = [
        { icon: <IconEdit24 />, color: '#277314', label: `${i18n.t("Edition")}`, disabled: false, disableOnInactive: true, loading: false, onClick: (e: any) => handleOpenModal(e, "edit") },
        { icon: <IconAddCircle24 />, color: '#1b6d85', label: `${i18n.t("Enroll")}`, disabled: false, disableOnInactive: false, loading: false, onClick: (e: any) => handleOpenEnrollModal(e) },
    ];

    // Transform table data to render enrollment status as a colored chip
    const displayTableData = useMemo(() => {
        return tableData.data.map((row: any) => ({
            ...row,
            hasActiveEnrollment: row.hasActiveEnrollment === 'Yes'
                ? <Tag positive>{i18n.t('Enrolled')}</Tag>
                : <Tag neutral>{i18n.t('Not Enrolled')}</Tag>
        }));
    }, [tableData.data]);

    // Admission date is a TEI attribute (full date like 2025-03-10).
    // When a year is selected, filter by date range within that year.
    const admissionDateAttribute = dataStoreData?.admission?.addmissionDate;

    useEffect(() => {
        if (school)
            void getData({
                page: pagination?.page,
                pageSize: pagination?.pageSize,
                program: program?.id as string,
                orgUnit: school!,
                attributeFilters: [
                    ...(filterState.attributes || []),
                    ...(academicYear && admissionDateAttribute
                        ? [`${admissionDateAttribute}:ge:${academicYear}-01-01:le:${academicYear}-12-31`]
                        : [])
                ],
                baseProgramStage: dataStoreData?.registration?.programStage ?? "",
                order: dataStoreData.defaults.defaultOrder,
                academicYear: academicYear ?? undefined,
                academicYearDataElement: dataStoreData?.registration?.academicYear
            })
    }, [sectionType, filterState, pagination.page, pagination?.pageSize, refetch, school, academicYear])

    return (
        <div style={{ height: "85vh" }}>
            {
                !(Boolean(schoolName) && Boolean(school)) ?
                    <InfoPage
                        title={i18n.t("SEMIS-Admission")}
                        sections={[
                            {
                                sectionTitle: `${i18n.t("Follow the instructions to proceed")}:`,
                                instructions: [
                                    `${i18n.t("Select the Organization unit you want to view data")}`,
                                    `${i18n.t("Use global filters(Class, Grade and Academic Year)")}`
                                ]
                            }
                        ]}
                    />
                    :
                    <>
                        <Table
                            tableData={displayTableData}
                            programConfig={program!}
                            pagination={pagination}
                            setPagination={setPagination}
                            paginate={!loading}
                            title={i18n.t("Admissions")}
                            viewPortWidth={viewPortWidth}
                            columns={admissionColumns}
                            rowAction={rowsActions}
                            defaultFilterNumber={3}
                            showRowActions
                            filterState={filterState}
                            loading={loading}
                            rightElements={<AdmissionActionsButtons i18n={i18n} baseUrl={baseUrl} />}
                            setFilterState={setFilterState}
                        />
                        {openDeleteModal && <ModalManagerAdmissionDelete i18n={i18n} open={openDeleteModal} setOpen={setOpenDeleteModal} saveMode="UPDATE" />}
                        {openEditModal && <ModalManager i18n={i18n} formVariablesFields={formData} formFields={admissionFormFields} open={openEditModal} setOpen={setOpenEditModal} saveMode="UPDATE" />}
                        {openEnrollModal && (
                            <EnrollSingleModal
                                i18n={i18n}
                                open={openEnrollModal}
                                setOpen={setOpenEnrollModal}
                                trackedEntityId={enrollStudentData.trackedEntityId}
                                enrollmentId={enrollStudentData.enrollmentId}
                                activeEnrollmentToComplete={enrollStudentData.activeEnrollmentToComplete || undefined}
                                activeEnrollmentEnrolledAt={enrollStudentData.activeEnrollmentEnrolledAt || undefined}
                                defaultAcademicYear={academicYear ?? undefined}
                                academicYearDataElement={dataStoreData?.registration?.academicYear}
                                initialValues={enrollStudentData.initialValues}
                                formFields={enrollFormFields}
                                formVariablesFields={enrollFormData}
                                onComplete={() => setOpenEnrollModal(false)}
                            />
                        )}
                    </>
            }
        </div>
    )
}
