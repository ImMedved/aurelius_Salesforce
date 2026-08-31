/**
 * Created by Kevin on 11. 03. 24.
 */

import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getCourses from '@salesforce/apex/RegistrationOverviewController.getCourses';
import getExamPeriods from '@salesforce/apex/RegistrationOverviewController.getExamPeriods';
import getRegistrations from '@salesforce/apex/RegistrationOverviewController.getRegistrations';
import getStudents from '@salesforce/apex/RegistrationOverviewController.getStudents';
import registerStudent from '@salesforce/apex/RegistrationOverviewController.registerStudent';
import unregisterStudent from '@salesforce/apex/RegistrationOverviewController.unregisterStudent';

export default class RegistrationOverview extends LightningElement {
    selectedSubjectId = '';
    modalStudentId = null;
    modalSubjectId = null;
    modalExamPeriodId = null;

    subjects = [];
    examPeriods = [];
    registrations = [];
    students = [];
    modalExamPeriods = [];

    showRegistrationModal = false;
    wiredRegistrationsResult;

    @wire(getStudents)
    wiredStudents({ data, error }) {
        if (data) {
            this.students = data;
        } else if (error) {
            this.showError(error, 'Unable to load students.');
        }
    }

    @wire(getCourses)
    wiredSubjects({ data, error }) {
        if (data) {
            this.subjects = data;
        } else if (error) {
            this.showError(error, 'Unable to load subjects.');
        }
    }

    @wire(getExamPeriods, { courseId: '$selectedSubjectFilterId' })
    wiredExamPeriods({ data, error }) {
        if (data) {
            this.examPeriods = data;
        } else if (error) {
            this.showError(error, 'Unable to load exam periods.');
        }
    }

    @wire(getRegistrations, {
        courseId: '$selectedSubjectFilterId',
        examPeriodId: null
    })
    wiredRegistrations(result) {
        this.wiredRegistrationsResult = result;

        const { data, error } = result;

        if (data) {
            this.registrations = data;
        } else if (error) {
            this.showError(error, 'Unable to load registrations.');
        }
    }

    get subjectOptions() {
        return [
            { label: 'All Subjects', value: '' },
            ...this.subjects.map(subject => ({
                label: subject.Name,
                value: subject.Id
            }))
        ];
    }

    get selectedSubjectFilterId() {
        return this.selectedSubjectId || null;
    }

    get modalSubjectOptions() {
        return this.subjectOptions.filter(option => option.value);
    }

    get studentOptions() {
        return this.students.map(student => ({
            label: [
                student.First_Name__c,
                student.Last_Name__c,
                student.EMSO_Text__c
            ]
                .filter(Boolean)
                .join(', '),
            value: student.Id
        }));
    }

    get modalExamPeriodOptions() {
        return this.modalExamPeriods.map(exam => ({
            label: `${exam.Name}${exam.Date__c ? ` - ${exam.Date__c}` : ''}`,
            value: exam.Id
        }));
    }

    get hasExamPeriods() {
        return this.examPeriodRows.length > 0;
    }

    get isModalExamPeriodDisabled() {
        return !this.modalSubjectId;
    }

    get isRegisterDisabled() {
        return !this.modalStudentId || !this.modalSubjectId || !this.modalExamPeriodId;
    }

    get examPeriodRows() {
        return this.examPeriods.map(exam => {
            const registrations = this.registrations
                .filter(registration => registration.Exam__c === exam.Id)
                .map(registration => this.toRegistrationRow(registration));

            return {
                id: exam.Id,
                label: `${exam.Name} - ${this.formatDate(exam.Date__c)} (${registrations.length})`,
                registrations,
                hasRegistrations: registrations.length > 0
            };
        });
    }

    handleSubjectChange(event) {
        this.selectedSubjectId = event.detail.value || '';
    }

    openRegistrationModal() {
        this.modalStudentId = null;
        this.modalSubjectId = this.selectedSubjectFilterId;
        this.modalExamPeriodId = null;
        this.modalExamPeriods = [];
        this.showRegistrationModal = true;

        if (this.modalSubjectId) {
            this.loadModalExamPeriods();
        }
    }

    closeRegistrationModal() {
        this.showRegistrationModal = false;
    }

    handleModalStudentChange(event) {
        this.modalStudentId = event.detail.value;
    }

    async handleModalSubjectChange(event) {
        this.modalSubjectId = event.detail.value;
        this.modalExamPeriodId = null;
        await this.loadModalExamPeriods();
    }

    handleModalExamPeriodChange(event) {
        this.modalExamPeriodId = event.detail.value;
    }

    async loadModalExamPeriods() {
        if (!this.modalSubjectId) {
            this.modalExamPeriods = [];
            return;
        }

        try {
            this.modalExamPeriods = await getExamPeriods({
                courseId: this.modalSubjectId
            });
        } catch (error) {
            this.showError(error, 'Unable to load exam periods.');
        }
    }

    async handleRegisterStudent() {
        if (this.isRegisterDisabled) {
            this.showToast('Error', 'Student, Subject and Exam Period are required.', 'error');
            return;
        }

        try {
            await registerStudent({
                studentId: this.modalStudentId,
                examPeriodId: this.modalExamPeriodId
            });

            this.showToast('Success', 'Student registered successfully.', 'success');
            this.closeRegistrationModal();
            await refreshApex(this.wiredRegistrationsResult);
        } catch (error) {
            this.showError(error, 'Unable to register student.');
        }
    }

    async handleUnregister(event) {
        try {
            await unregisterStudent({
                registrationId: event.currentTarget.dataset.id
            });

            this.showToast('Success', 'Student withdrawn successfully.', 'success');
            await refreshApex(this.wiredRegistrationsResult);
        } catch (error) {
            this.showError(error, 'Unable to withdraw student.');
        }
    }

    toRegistrationRow(registration) {
        const status = this.getDisplayStatus(registration);

        return {
            id: registration.Id,
            studentName: [
                registration.Student__r?.First_Name__c,
                registration.Student__r?.Last_Name__c
            ]
                .filter(Boolean)
                .join(' '),
            emso: registration.Student__r?.EMSO_Text__c ?? '',
            status,
            statusClass: this.getStatusClass(status),
            unregisterDisabled:
                registration.Registration_Status__c === 'Completed' ||
                registration.Registration_Status__c === 'Unregistered'
        };
    }

    getDisplayStatus(registration) {
        if (registration.Registration_Status__c === 'Not yet completed') {
            return 'Registered';
        }

        if (
            registration.Registration_Status__c === 'Completed' &&
            registration.Result__c === 'Passed'
        ) {
            return 'Completed';
        }

        if (
            registration.Registration_Status__c === 'Completed' &&
            registration.Result__c === 'Not passed'
        ) {
            return 'Failed';
        }

        if (registration.Registration_Status__c === 'Unregistered') {
            return 'Withdrawn';
        }

        return registration.Registration_Status__c;
    }

    formatDate(value) {
        if (!value) {
            return '';
        }

        const [year, month, day] = value.split('-');
        return `${day}. ${month}. ${year}`;
    }

    getStatusClass(status) {
        const baseClass = 'slds-badge status-badge';

        if (status === 'Completed') {
            return `${baseClass} status-badge_completed`;
        }

        if (status === 'Failed') {
            return `${baseClass} status-badge_failed`;
        }

        return baseClass;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    showError(error, fallbackMessage) {
        const message =
            error?.body?.message ||
            error?.detail?.message ||
            fallbackMessage;

        this.showToast('Error', message, 'error');
    }
}