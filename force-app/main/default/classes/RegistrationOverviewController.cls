/**
 * Created by Kevin on 11. 03. 24.
 */

public with sharing class RegistrationOverviewController {

	@AuraEnabled
	public static List<Exam_Registration__c> getExamRegistrations() {
		List<Exam_Registration__c> registrations = new List<Exam_Registration__c>();
		try {
			registrations = [SELECt Id, Student__r.Name FROM Exam_Registration__c];

		} catch (Exception e) {

		}
		return registrations;
	}

}