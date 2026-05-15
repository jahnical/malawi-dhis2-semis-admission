import { useRecoilValue } from 'recoil';
import React, { useEffect, useMemo, useState } from "react";
import { IconEdit24, IconAddCircle24, IconInfo24, Tag } from "@dhis2/ui";
import { Table, InfoPage, useSchoolCalendarKey, ModalComponent, EnrollmentDetailsComponent } from "dhis2-semis-components";
import ModalManager from "../../components/modal/saveAdmission/ModalManager";
import EnrollSingleModal from "../../components/modal/enrollFromAdmission/EnrollSingleModal";
import { TableDataRefetch, Modules, ProgramConfig, D2I18n, VariablesTypes, CustomAttributeProps } from "dhis2-semis-types"
import useGetSelectedProgram from '../../hooks/config/useGetSelectedKeys';
import ModalManagerAdmissionDelete from '../../components/modal/deleteAdmission/ModalManager';
import { useBuildForm, useHeader, useTableData, useUrlParams, useViewPortWidth } from "dhis2-semis-functions";
import AdmissionActionsButtons from "../../components/admissionButtons/AdmissionActionsButtons";
import { formFields } from '../../utils/constants/form/admissionForm';
import { enrollmentFormFields } from '../../utils/constants/form/enrollmentForm';
import { SelectedStudent } from '../../components/modal/enrollFromAdmission/EnrollBulkModal';

export default function AdmissionsPage({ i18n, baseUrl }: { i18n: D2I18n, baseUrl: string }) {
    const { viewPortWidth } = useViewPortWidth()
    const { urlParameters, add, remove } = useUrlParams()
    const { program, dataStoreData } = useGetSelectedProgram()
    const schoolCalendar = useSchoolCalendarKey()
    const { academicYear, school, schoolName, sectionType } = urlParameters
    const [openEditModal, setOpenEditModal] = useState<boolean>(false)
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false)
    const [openEnrollModal, setOpenEnrollModal] = useState<boolean>(false)
    const [openInfoModal, setOpenInfoModal] = useState<boolean>(false)
    const [selectedInfoRow, setSelectedInfoRow] = useState<Record<string, any> | null>(null)
    const [selectedRows, setSelectedRows] = useState<Record<string, any>[]>([])
    const [enrollStudentData, setEnrollStudentData] = useState<{ trackedEntityId: string; enrollmentId: string; activeEnrollmentToComplete: string; activeEnrollmentEnrolledAt: string; initialValues: Record<string, any> }>({ trackedEntityId: "", enrollmentId: "", activeEnrollmentToComplete: "", activeEnrollmentEnrolledAt: "", initialValues: {} })
    const { getData, tableData, loading } = useTableData({ module: Modules.Admission });
    const [filterState, setFilterState] = useState<{ dataElements: any, attributes: any }>({ attributes: [], dataElements: [] });
    const refetch = useRecoilValue(TableDataRefetch);
    const [pagination, setPagination] = useState<any>({ page: 1, pageSize: 50, totalPages: 0, totalElements: 0 })
    const { columns } = useHeader({ dataStoreData, programConfigData: program as unknown as ProgramConfig, programStage: "" });
    const { formData } = useBuildForm({ dataStoreData, programData: program, module: Modules.Admission, schoolCalendar });
    const { formData: enrollFormData } = useBuildForm({ dataStoreData, programData: program, module: Modules.Enrollment, schoolCalendar });
    const admissionFormFields = formFields({ formFieldsData: formData, sectionName: sectionType!, admissionDateAttributeId: dataStoreData?.admission?.admissionDate, studentIdentifierAttributeId: dataStoreData?.admission?.studentIdentifier })
    const enrollFormFields = enrollmentFormFields({ formFieldsData: enrollFormData, sectionName: sectionType! })
    const attributeFields = useMemo(() => (formData?.[0] ?? []).filter((f: any) => f.type === "attribute"), [formData])

    // Customize admission table columns:
    // - Remove section and filter data element columns (stream/class)
    // - Rename grade column to "Current Standard"
    // - Add "Enrollment Status" custom column
    const admissionColumns = useMemo(() => {
        if (!columns || !dataStoreData) return columns;

        const sectionId = dataStoreData?.registration?.section;
        const academicYearId = dataStoreData?.registration?.academicYear;
        const gradeId = dataStoreData?.registration?.grade;
        const filterDataElementIds = dataStoreData?.filters?.dataElements?.map((f: any) => f.dataElement) ?? [];
        const admissionDateId = dataStoreData?.admission?.admissionDate;
        const columnsToRemove = [sectionId, academicYearId, ...filterDataElementIds]
            .filter((id: any) => Boolean(id) && id !== gradeId);

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

        const transferColumn: CustomAttributeProps = {
            id: "transferCategory",
            displayName: i18n.t("Transfer"),
            header: i18n.t("Transfer"),
            name: i18n.t("Transfer"),
            labelName: i18n.t("Transfer"),
            required: false,
            valueType: "TEXT" as unknown as CustomAttributeProps["valueType"],
            visible: true,
            disabled: false,
            pattern: "",
            searchable: false,
            error: false,
            content: "",
            key: "transferCategory",
            type: VariablesTypes.Custom
        };

        const filtered = columns
            .filter((col: CustomAttributeProps) => !columnsToRemove.includes(col.id))
            .map((col: CustomAttributeProps) => {
                if (col.id === gradeId) {
                    return {
                        ...col,
                        visible: true,
                        searchable: true,
                        displayName: i18n.t("Current Standard"),
                        header: i18n.t("Current Standard"),
                        name: i18n.t("Current Standard"),
                        labelName: i18n.t("Current Standard")
                    };
                }
                // Ensure admission date column is always visible
                if (admissionDateId && col.id === admissionDateId) {
                    return { ...col, visible: true, displayName: i18n.t("Admission Date"), header: i18n.t("Admission Date"), name: i18n.t("Admission Date"), labelName: i18n.t("Admission Date") };
                }
                return col;
            });

        return [...filtered, enrollmentStatusColumn, transferColumn];
    }, [columns, dataStoreData, i18n]);

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

    const handleOpenInfoModal = (e: Record<string, any>) => {
        const row = e?.row;
        if (!row) return;
        setSelectedInfoRow(row);
        setOpenInfoModal(true);
    };


    useEffect(() => {
        if (!openDeleteModal && !openEditModal) {
            remove("trackedEntity")
            remove("admission")
        }
    }, [openDeleteModal, openEditModal])

    const rowsActions = [
        { icon: <IconEdit24 />, color: '#277314', label: `${i18n.t("Edition")}`, disabled: false, disableOnInactive: true, loading: false, onClick: (e: any) => handleOpenModal(e, "edit") },
        {
            icon: <IconAddCircle24 />,
            color: '#1b6d85',
            label: `${i18n.t("Enroll")}`,
            disabled: (row?: Record<string, any>) => Boolean(row?.isEnrolledCurrentAcademicYear),
            disableOnInactive: false,
            loading: false,
            onClick: (e: any) => handleOpenEnrollModal(e)
        },
        {
            icon: <IconInfo24 />,
            color: '#144b73',
            label: `${i18n.t("View history")}`,
            disabled: false,
            disableOnInactive: false,
            loading: false,
            onClick: (e: any) => handleOpenInfoModal(e)
        },
    ];

    const dataElementFilterExpressions = useMemo(() => {
        return (filterState.dataElements ?? []).reduce((acc: string[], item: any) => {
            if (Array.isArray(item)) {
                const expression = item?.[0];
                if (typeof expression === 'string') acc.push(expression);
            } else if (typeof item === 'string') {
                acc.push(item);
            }
            return acc;
        }, []);
    }, [filterState.dataElements]);

    const matchesDataElementFilter = (row: Record<string, any>, expression: string) => {
        const [fieldId, operator, firstValue, ...rest] = expression.split(':');
        const rawValue = row?.[fieldId];

        if (rawValue === undefined || rawValue === null) return false;

        const rowValue = String(rawValue);
        const normalizedRowValue = rowValue.toLowerCase();

        switch (operator) {
            case 'eq':
                return normalizedRowValue === String(firstValue ?? '').toLowerCase();

            case 'in': {
                const options = String([firstValue, ...rest].join(':') ?? '')
                    .split(';')
                    .map((value) => value.toLowerCase());
                return options.includes(normalizedRowValue);
            }

            case 'like':
                return normalizedRowValue.includes(String([firstValue, ...rest].join(':') ?? '').toLowerCase());

            case 'ge': {
                const leIndex = rest.findIndex((token) => token === 'le');
                const endValue = leIndex > -1 ? rest[leIndex + 1] : undefined;

                if (firstValue && rowValue < firstValue) return false;
                if (endValue && rowValue > endValue) return false;
                return true;
            }

            default:
                return true;
        }
    };

    const filteredRowsByDataElements = useMemo(() => {
        if (!dataElementFilterExpressions.length) return tableData.data;

        return tableData.data.filter((row: Record<string, any>) =>
            dataElementFilterExpressions.every((expression: string) => matchesDataElementFilter(row, expression))
        );
    }, [tableData.data, dataElementFilterExpressions]);

    // Transform table data to render enrollment status as a colored chip
    const displayTableData = useMemo(() => {
        console.log("Raw table data:", tableData.data);
        return filteredRowsByDataElements.map((row: any) => ({
            ...row,
            isEnrolledCurrentAcademicYear: row.hasActiveEnrollment === 'Yes',
            disableSelection: row.hasActiveEnrollment === 'Yes',
            hasActiveEnrollment: row.hasActiveEnrollment === 'Yes'
                ? <Tag positive>{i18n.t('Enrolled')}</Tag>
                : <Tag neutral>{i18n.t('Not Enrolled')}</Tag>,
            transferCategory: row.transferCategory === 'Transfer IN'
                ? <Tag positive>{i18n.t('Transfer IN')}</Tag>
                : row.transferCategory === 'Transfer OUT'
                    ? <Tag negative>{i18n.t('Transfer OUT')}</Tag>
                    : row.transferCategory === '_' ? "_" : row.transferCategory
        }));
    }, [tableData.data, filteredRowsByDataElements, i18n]);

    const selectedStudents = useMemo<SelectedStudent[]>(() => {
        return selectedRows
            .filter((row: Record<string, any>) => !row.disableSelection)
            .map((row: Record<string, any>) => ({
                trackedEntity: row.trackedEntity,
                enrollmentId: row.enrollableEnrollmentId,
                activeEnrollmentToComplete: row.activeEnrollmentToComplete,
                activeEnrollmentEnrolledAt: row.activeEnrollmentEnrolledAt,
                attributes: attributeFields
                    .filter((field: any) => row[field.id] !== undefined)
                    .map((field: any) => ({ attribute: field.id, value: row[field.id] }))
            }));
    }, [selectedRows, attributeFields]);

    useEffect(() => {
        setSelectedRows((prev) => prev.filter((row: Record<string, any>) =>
            displayTableData.some((currentRow: Record<string, any>) =>
                currentRow.trackedEntity === row.trackedEntity && !currentRow.disableSelection
            )
        ));
    }, [displayTableData]);

    useEffect(() => {
        setPagination((prev: any) => ({
            ...prev,
            totalPages: tableData?.pagination?.totalPages,
            totalElements: displayTableData?.length ?? tableData?.pagination?.totalElements
        }))
    }, [tableData, displayTableData])

    // Admission date is a TEI attribute (full date like 2025-03-10).
    // When an academic year is selected, filter by that year only.
    const admissionDateAttribute = dataStoreData?.admission?.admissionDate;
    const defaultCalendarAcademicYear = (schoolCalendar as any)?.defaults?.academicYear;
    const calendars = (schoolCalendar as any)?.schoolCalendar ?? [];
    const selectedCalendar = calendars.find((cal: any) =>
        cal?.academicYear?.code === academicYear || cal?.academicYear?.id === academicYear || cal?.id === academicYear
    );
    const academicYearCode = selectedCalendar?.academicYear?.code || academicYear;
    const firstYearMatch = typeof academicYearCode === 'string' ? academicYearCode.match(/\d{4}/) : null;
    const admissionYear = firstYearMatch ? Number(firstYearMatch[0]) : NaN;
    const admissionYearStart = Number.isInteger(admissionYear) ? `${admissionYear}-01-01` : undefined;
    const admissionYearEnd = Number.isInteger(admissionYear) ? `${admissionYear}-12-31` : undefined;
    const hasAdmissionYearDateFilter = Boolean(academicYear && admissionDateAttribute && admissionYearStart && admissionYearEnd);

    useEffect(() => {
        if (school)
            void getData({
                page: pagination?.page,
                pageSize: pagination?.pageSize,
                program: program?.id as string,
                orgUnit: school!,
                attributeFilters: [
                    ...(filterState.attributes || []),
                    ...(hasAdmissionYearDateFilter
                        ? [`${admissionDateAttribute}:ge:${admissionYearStart}:le:${admissionYearEnd}`]
                        : [])
                ],
                baseProgramStage: dataStoreData?.registration?.programStage ?? "",
                order: dataStoreData.defaults.defaultOrder,
                academicYear: academicYear ?? undefined,
                enrollmentStatusAcademicYear: defaultCalendarAcademicYear ?? academicYear ?? undefined,
                academicYearDataElement: dataStoreData?.registration?.academicYear,
                filterAdmissionByEventAcademicYear: Boolean(academicYear && !hasAdmissionYearDateFilter),
                transferConfig: {
                    transferProgramStage: dataStoreData?.transfer?.programStage,
                    destinySchoolDataElement: dataStoreData?.transfer?.destinySchool,
                },
                ouMode: "DESCENDANTS"
            })
    }, [sectionType, filterState, pagination.page, pagination?.pageSize, refetch, school, academicYear, dataStoreData])

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
                            selectable
                            selected={selectedRows}
                            setSelected={setSelectedRows}
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
                            rightElements={
                                <AdmissionActionsButtons
                                    i18n={i18n}
                                    baseUrl={baseUrl}
                                    selectedStudents={selectedStudents}
                                    enrollmentFormFields={enrollFormFields}
                                    enrollmentFormVariables={enrollFormData}
                                    defaultAcademicYear={defaultCalendarAcademicYear ?? academicYear ?? undefined}
                                    academicYearDataElement={dataStoreData?.registration?.academicYear}
                                />
                            }
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
                                defaultAcademicYear={defaultCalendarAcademicYear ?? academicYear ?? undefined}
                                academicYearDataElement={dataStoreData?.registration?.academicYear}
                                initialValues={enrollStudentData.initialValues}
                                formFields={enrollFormFields}
                                formVariablesFields={enrollFormData}
                                onComplete={() => setOpenEnrollModal(false)}
                            />
                        )}
                        {openInfoModal && (
                            <ModalComponent
                                open={openInfoModal}
                                handleClose={() => {
                                    setOpenInfoModal(false);
                                    setSelectedInfoRow(null);
                                }}
                                title={i18n.t("Enrollment History")}
                                size="large"
                            >
                                <EnrollmentDetailsComponent
                                    programConfig={program!}
                                    enrollmentsData={selectedInfoRow?.registrationEvents ?? []}
                                    existingAcademicYear={Boolean(selectedInfoRow?.isEnrolledCurrentAcademicYear)}
                                    onSelectTei={selectedInfoRow ? () => {
                                        handleOpenEnrollModal({ row: selectedInfoRow });
                                        setOpenInfoModal(false);
                                    } : undefined}
                                />
                            </ModalComponent>
                        )}
                    </>
            }
        </div>
    )
}
