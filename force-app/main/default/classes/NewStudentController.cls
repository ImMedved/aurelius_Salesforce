/**
 * Created by Kevin on 28. 02. 24.
 */

public with sharing class NewStudentController {

	@AuraEnabled
	public static Boolean createStudent(String studentJSON) {
		Boolean response = true;

		Student studentPARSED = (Student) System.JSON.deserialize(studentJSON, Student.class);

		Student__c student = new Student__c();
		student.First_Name__c = studentPARSED.firstName;
		student.Last_Name__c = studentPARSED.lastName;
		student.Enrollment_Type__c = studentPARSED.enrollmentType;
		//TODO - EMSO CHECK, EMSO UNIQUEx
		student.EMSO__c = studentPARSED.emso;

		if(String.valueOf(student.EMSO__c).split('').size() == 13) {
			insert student;
		}

		return response;
	}

	//TODO - Wrapper or casting directly in Student__c object?
	public class Student {
		public String firstName;
		public String lastName;
		public String enrollmentType;
		public Long emso;
	}
}