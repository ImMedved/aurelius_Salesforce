/**
 * Created by Kevin on 11. 03. 24.
 */

import {LightningElement, track} from 'lwc';
import {ShowToastEvent} from "lightning/platformShowToastEvent";
import getExamRegistrations from "@salesforce/apex/RegistrationOverviewController.getExamRegistrations";

export default class RegistrationOverview extends LightningElement {
    @track registrations;

    connectedCallback() {
        getExamRegistrations({ studentJSON: JSON.stringify(this.student) })
            .then((result) => {
                this.registrations = result;
            })
            .catch((error) => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'Something went wrong',
                    variant: 'error',
                }));
            });
    }
}