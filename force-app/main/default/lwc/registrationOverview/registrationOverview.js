/**
 * Created by Kevin on 11. 03. 24.
 */

import { LightningElement, wire } from 'lwc';

import getCourses from '@salesforce/apex/RegistrationOverviewController.getCourses';
import getExamPeriods from '@salesforce/apex/RegistrationOverviewController.getExamPeriods';
import getRegistrations from '@salesforce/apex/RegistrationOverviewController.getRegistrations';

import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getStudents from '@salesforce/apex/RegistrationOverviewController.getStudents';
import registerStudent from '@salesforce/apex/RegistrationOverviewController.registerStudent';
import unregisterStudent from '@salesforce/apex/RegistrationOverviewController.unregisterStudent';

const COLUMNS = [
    {
        label: 'Student',
        fieldName: 'studentName'
    },
    {
        label: 'EMŠO',
        fieldName: 'emso'
    },
    {
        label: 'Course',
        fieldName: 'courseName'
    },
    {
        label: 'Exam Period',
        fieldName: 'examPeriodName'
    },
    {
        label: 'Date',
        fieldName: 'examDate',
        type: 'date'
    },
    {
        label: 'Status',
        fieldName: 'status'
    },
    {
        label: 'Grade',
        fieldName: 'grade',
        type: 'number'
    },
    {
        label: 'Result',
        fieldName: 'result'
    }
];

export default class RegistrationOverview extends LightningElement {
    columns = COLUMNS;

    selectedCourseId = null;
    selectedExamPeriodId = null;
    modalStudentId = null;
    modalCourseId = null;
    modalExamPeriodId = null;

    modalExamPeriods = [];
    courses = [];
    examPeriods = [];
    registrations = [];
    students = [];

    showRegistrationModal = false;
    wiredRegistrationsResult;

    @wire(getStudents)
    wiredStudents({ data, error }) {
        if (data) {
            this.students = data;
        } else if (error) {
            console.error(error);
        }
    }

    @wire(getCourses)
    wiredCourses({ data, error }) {
        if (data) {
            this.courses = data;
        } else if (error) {
            console.error(error);
        }
    }

    @wire(getExamPeriods, { courseId: '$selectedCourseId' })
    wiredExamPeriods({ data, error }) {
        if (data) {
            this.examPeriods = data;
        } else if (error) {
            console.error(error);
        }
    }

    @wire(getRegistrations, {
        courseId: '$selectedCourseId',
        examPeriodId: '$selectedExamPeriodId'
    })
    wiredRegistrations(result) {
        this.wiredRegistrationsResult = result;

        const { data, error } = result;

        if (data) {
            this.registrations = data;
        } else if (error) {
            console.error(error);
        }
    }

    get studentOptions() {
        return this.students.map(student => ({
            label: [
                student.First_Name__c,
                student.Last_Name__c
            ]
                .filter(Boolean)
                .join(' '),

            value: student.Id
        }));
    }

    get modalCourseOptions() {
        return this.courseOptions.filter(option => option.value);
    }

    get courseOptions() {
        return [
            { label: 'All Courses', value: '' },
            ...this.courses.map(course => ({
                label: course.Name,
                value: course.Id
            }))
        ];
    }

    get examPeriodOptions() {
        return [
            { label: 'All Exam Periods', value: '' },
            ...this.examPeriods.map(exam => ({
                label: exam.Name,
                value: exam.Id
            }))
        ];
    }

    get modalExamPeriodOptions() {
        return this.modalExamPeriods.map(exam => ({
            label: `${exam.Name}${exam.Date__c ? ` - ${exam.Date__c}` : ''}`,
            value: exam.Id
        }));
    }

    get registrationRows() {
        return this.registrations.map(registration => ({
            id: registration.Id,

            studentName: [
                registration.Student__r?.First_Name__c,
                registration.Student__r?.Last_Name__c
            ]
                .filter(Boolean)
                .join(' '),

            emso:
                registration.Student__r?.EMSO_Text__c ?? '',

            courseName:
                registration.Exam__r?.Subject__r?.Name ?? '',

            examPeriodName:
                registration.Exam__r?.Name ?? '',

            examDate:
                registration.Exam__r?.Date__c ?? null,

            status:
                registration.Registration_Status__c ?? '',

            grade:
                registration.Grade__c ?? null,

            result:
                registration.Result__c ?? '',
            unregisterDisabled:
                registration.Registration_Status__c === 'Completed' ||
                registration.Registration_Status__c === 'Unregistered'
        }));
    }

    get hasRegistrations() {
        return this.registrationRows.length > 0;
    }

    openRegistrationModal() {
        this.modalStudentId = null;
        this.modalCourseId = this.selectedCourseId;
        this.modalExamPeriodId = null;
        this.modalExamPeriods = [];

        this.showRegistrationModal = true;

        if (this.modalCourseId) {
            this.loadModalExamPeriods();
        }
    }

    closeRegistrationModal() {
        this.showRegistrationModal = false;
    }

    handleCourseChange(event) {
        this.selectedCourseId = event.detail.value || null;
        this.selectedExamPeriodId = null;
    }

    handleExamPeriodChange(event) {
        this.selectedExamPeriodId = event.detail.value || null;
    }

    handleClearFilters() {
        this.selectedCourseId = null;
        this.selectedExamPeriodId = null;
    }

    handleModalStudentChange(event) {
        this.modalStudentId = event.detail.value;
    }

    async handleModalCourseChange(event) {
        this.modalCourseId = event.detail.value;
        this.modalExamPeriodId = null;

        await this.loadModalExamPeriods();
    }

    handleModalExamPeriodChange(event) {
        this.modalExamPeriodId = event.detail.value;
    }

    async loadModalExamPeriods() {
        if (!this.modalCourseId) {
            this.modalExamPeriods = [];
            return;
        }

        try {
            this.modalExamPeriods = await getExamPeriods({
                courseId: this.modalCourseId
            });
        } catch (error) {
            this.showError(error, 'Unable to load exam periods.');
        }
    }

    async handleRegisterStudent() {
        if (
            !this.modalStudentId ||
            !this.modalCourseId ||
            !this.modalExamPeriodId
        ) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Student, Course and Exam Period are required.',
                    variant: 'error'
                })
            );

            return;
        }

        try {
            await registerStudent({
                studentId: this.modalStudentId,
                examPeriodId: this.modalExamPeriodId
            });

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Student registered successfully.',
                    variant: 'success'
                })
            );

            this.showRegistrationModal = false;

            await refreshApex(this.wiredRegistrationsResult);
        } catch (error) {
            this.showError(error, 'Unable to register student.');
        }
    }

    showError(error, fallbackMessage) {
        const message =
            error?.body?.message ||
            error?.detail?.message ||
            fallbackMessage;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message,
                variant: 'error'
            })
        );
    }

    async handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;

        if (action.name !== 'unregister') {
            return;
        }

        try {
            await unregisterStudent({
                registrationId: row.id
            });

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Student unregistered successfully.',
                    variant: 'success'
                })
            );

            await refreshApex(this.wiredRegistrationsResult);
        } catch (error) {
            this.showError(error, 'Unable to unregister student.');
        }
    }

    get isModalExamPeriodDisabled() {
        return !this.modalCourseId;
    }
}