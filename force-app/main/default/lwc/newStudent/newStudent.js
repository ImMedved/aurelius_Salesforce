/**
 * Created by Kevin on 28. 02. 24.
 */

import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import createStudent from "@salesforce/apex/NewStudentController.createStudent";

export default class NewStudent extends LightningElement {
    @track student = {};
    enrollmentTypeOptions = [
        { label: "Regular Student", value: "Regular Student" },
        { label: "Part-time Student", value: "Part-time Student" }
    ];

    get showPayerField() {
        return this.student.enrollmentType === 'Part-time Student';
    }

    handleEnrollmentTypeChange(event) {
        this.student = {
            ...this.student,
            enrollmentType: event.detail.value
        };
    }

    handleCreateStudent() {
        let fields = this.template.querySelectorAll('[data-input]');
        this.student = {};
        for (let i = 0; i < fields.length; i++) {
            let field = fields[i];
            this.student[field.dataset.input] = field.type == 'checkbox' ? field.checked : field.value;
        }

        createStudent({ studentJSON: JSON.stringify(this.student) })
            .then((result) => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Student created',
                    variant: 'success',
                }));
                this.clearFields(fields);
            })
            .catch((error) => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'Something went wrong',
                    variant: 'error',
                }));
            });
    }

    clearFields = (fieldList) => {
        [...fieldList].reduce((validSoFar, inputCmp) => {
            inputCmp.value = null;
            inputCmp.checked = false;
        }, true);
        this.student = {};
    };
}