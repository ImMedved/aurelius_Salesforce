import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CourseEntry extends LightningElement {
    handleSuccess() {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Course created successfully.',
                variant: 'success'
            })
        );

        this.template
            .querySelectorAll('lightning-input-field')
            .forEach(field => field.reset());
    }

    handleError(event) {
        const message =
            event.detail?.detail ||
            event.detail?.message ||
            'Unable to create course.';

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message,
                variant: 'error'
            })
        );
    }
}