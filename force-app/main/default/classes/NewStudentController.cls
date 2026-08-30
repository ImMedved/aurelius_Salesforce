/**
 * Created by Kevin on 28. 02. 24.
 */

public with sharing class NewStudentController {

	@AuraEnabled
	public static Boolean createStudent(String studentJSON) {
		Student studentParsed = (Student) System.JSON.deserialize(studentJSON, Student.class);

		Student__c student = new Student__c();
		student.First_Name__c = studentParsed.firstName;
		student.Last_Name__c = studentParsed.lastName;
		student.Enrollment_Type__c = studentParsed.enrollmentType;
		student.EMSO_Text__c = studentParsed.emso;
		student.Payer__c = studentParsed.payer == true;

		insert student;

		return true;
	}

	//TODO - Wrapper or casting directly in Student__c object?
	public class Student {
		public String firstName;
		public String lastName;
		public String enrollmentType;
		public String emso;
		public Boolean payer;
	}
}