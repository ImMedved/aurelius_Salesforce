/**
 * Created by Kevin on 11. 03. 24.
 */

public with sharing class RegistrationOverviewController {

    @AuraEnabled(cacheable=true)
    public static List<Subject__c> getCourses() {
        return [
            SELECT Id, Name
            FROM Subject__c
            ORDER BY Name
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Exam__c> getExamPeriods(Id courseId) {
        if (courseId == null) {
            return [
                SELECT Id, Name, Date__c, Subject__c, Subject__r.Name
                FROM Exam__c
                ORDER BY Date__c, Name
            ];
        }

        return [
            SELECT Id, Name, Date__c, Subject__c, Subject__r.Name
            FROM Exam__c
            WHERE Subject__c = :courseId
            ORDER BY Date__c, Name
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Exam_Registration__c> getRegistrations(
        Id courseId,
        Id examPeriodId
    ) {
        String query =
            'SELECT Id, Name, ' +
            'Student__c, Student__r.First_Name__c, Student__r.Last_Name__c, Student__r.EMSO_Text__c, ' +
            'Exam__c, Exam__r.Name, Exam__r.Date__c, Exam__r.Subject__c, Exam__r.Subject__r.Name, ' +
            'Registration_Status__c, Grade__c, Result__c, Unregistration_Date__c ' +
            'FROM Exam_Registration__c';

        List<String> conditions = new List<String>();

        if (courseId != null) {
            conditions.add('Exam__r.Subject__c = :courseId');
        }

        if (examPeriodId != null) {
            conditions.add('Exam__c = :examPeriodId');
        }

        if (!conditions.isEmpty()) {
            query += ' WHERE ' + String.join(conditions, ' AND ');
        }

        query += ' ORDER BY Exam__r.Date__c DESC, Student__r.Last_Name__c';

        return Database.query(query);
    }
	@AuraEnabled(cacheable=true)
	public static List<Student__c> getStudents() {
		return [
			SELECT Id, First_Name__c, Last_Name__c, EMSO_Text__c
			FROM Student__c
			ORDER BY Last_Name__c, First_Name__c
		];
	}

	@AuraEnabled
	public static Id registerStudent(Id studentId, Id examPeriodId) {
		if (studentId == null || examPeriodId == null) {
			throw new AuraHandledException('Student and Exam Period are required.');
		}

		Integer existingRegistrations = [
			SELECT COUNT()
			FROM Exam_Registration__c
			WHERE Student__c = :studentId
			AND Exam__c = :examPeriodId
		];

		if (existingRegistrations > 0) {
			throw new AuraHandledException(
				'This student is already registered for the selected exam period.'
			);
		}

		Exam_Registration__c registration = new Exam_Registration__c(
			Student__c = studentId,
			Exam__c = examPeriodId
		);

		insert registration;
		return registration.Id;
	}

	@AuraEnabled
	public static void unregisterStudent(Id registrationId) {
		if (registrationId == null) {
			throw new AuraHandledException('Registration is required.');
		}

		Exam_Registration__c registration = [
			SELECT Id, Registration_Status__c, Exam__r.Date__c
			FROM Exam_Registration__c
			WHERE Id = :registrationId
			LIMIT 1
		];

		if (registration.Registration_Status__c == 'Completed') {
			throw new AuraHandledException(
				'Completed registrations cannot be unregistered.'
			);
		}

		if (
			registration.Exam__r.Date__c != null &&
			Date.today() > registration.Exam__r.Date__c
		) {
			throw new AuraHandledException(
				'Students cannot be withdrawn after the exam date.'
			);
		}

		registration.Registration_Status__c = 'Unregistered';
		registration.Unregistration_Date__c = Date.today();
		update registration;
	}
}