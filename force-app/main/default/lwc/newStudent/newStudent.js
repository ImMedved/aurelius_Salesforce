/**
 * Created by Kevin on 28. 02. 24.
 */

import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class NewStudent extends LightningElement {
    enrollmentType;

    get showPayerField() {
        return this.enrollmentType === 'Part-time Student';
    }

    handleEnrollmentTypeChange(event) {
        this.enrollmentType = event.detail?.value ?? event.target.value;
    }

    handleSuccess() {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Student created successfully.',
                variant: 'success'
            })
        );

        this.template
            .querySelectorAll('lightning-input-field')
            .forEach(field => field.reset());

        this.enrollmentType = null;
    }

    handleError(event) {
        const message =
            event.detail?.detail ||
            event.detail?.message ||
            'Unable to create student.';

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message,
                variant: 'error'
            })
        );
    }
}