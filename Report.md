Work notes. Will be translated into English at the end.

## Step 1

The requirements do not specify whether the user has entered their own data into the database. Because of this, a backup/database_backup was created. Since all custom tables are empty, I will add 4 csv files to git. If there had been data in the database, they could not have been added.

## Step 2

The database needs to be brought into the correct state. Currently there are 4 tables:

Subject__c: CreatedById LastModifiedById OwnerId Name

Student__c: CreatedById EMSO__c Enrollment_Type__c First_Name__c LastModifiedById Last_Name__c OwnerId Name

Exam__c: CreatedById Name LastModifiedById OwnerId

Exam_Registration__c: CreatedById Exam__c Name LastModifiedById Registration_Status__c Student__c

Something like this is required:

   Enrollment --- Subject

  /                      \

Student                      Exam Period

  \                      /

      Exam Registration

The tables should be:

Student:

Name / Student ID     Auto Number     Required

First Name            Text(40)        Required    255 -> 40

Last Name             Text(40)        Required    255 -> 40

EMŠO                   Text(13)        Required    int -> text(13)

Type                   Picklist        Required    Regular/Part-time

Payer                  Checkbox

Subject:

Name                  Text(80)

ECTS                  Number            Required

Created By            CreatedById

Last Modified By      LastModifiedById

Owner                 OwnerId

Exam:

Name      Text(80)            Required    Label Exam name to Exam Period Name

Date__c   Date                Required

Subject__c Lookup(Subject__c) Required

Subject_Enrollment__c

Enrollment Id      Name           Required (Auto)

Student            Student__c     Required

Subject            Subject__c     Required

Exam Registration

Exam Period              Exam__c                   Master-Detail(Exam)            Change label

Registration Status      Registration_Status__c    Picklist   Conditional          define values (Not yet completed, Completed, Not completed, Unregistered)

Result                   Result__c                 Picklist   Conditional          Passed/Not passed

Grade                    Grade__c                  Number(2,0)   Conditional

Unregistration Date      Unregistration_Date__c    Date         Conditional

Student 1 -- N Enrollment N -- 1 Subject 1 -- N Exam 1 -- N Exam Registration N -- 1 Student

TODO: replace EMSO with text. DONE

Step 3: add tabs for all 5 objects

Add Page Layout, check that all required fields are actually marked as required.

Add rules for entering EMŠO, Payer appears only for Part-time Student, grade only between 1 and 10 and other rules. Check picklist fields.

## Step 4

After stabilizing the database structure, it is necessary to check the standard Salesforce workflow without using the custom Dashboard.

Test records were created:

Student → Subject Enrollment → Subject → Exam Period → Exam Registration. The checks passed without problems, later two fields were found where the Required flag had not been set.

## Step 5

The task requires validating entered data. I use Validation Rules for validation:

Student:

EMŠO must consist of 13 digits and pass the modulo 11 checksum validation. The date of birth must also be valid, for example, use 12 months and the correct number of days in each. The neural network wrote a validation rule for all months.

Payer is allowed only for a Part-time student. For a Regular student, the Payer value should not be used.

Exam Registration:

Grade is allowed only in the range from 1 to 10. Grade can only be set for a Completed registration. A Completed registration must contain a Grade. This is done through 3 separate rules.

Result is determined based on Grade:

1–5 → Not passed. 6–10 → Passed. After the registration receives the Completed status, only Grade can be changed. For Unregistered status, Unregistration Date is saved and a grade cannot be entered.

For automatic filling of the unregistration date, a Record-Triggered Flow was created: Registration Status → Unregistered → Unregistration Date = current date.

## Step 6

After stabilizing the standard Salesforce functionality, the second phase was started: Custom Dashboard. Initially, Management already has a field, but it does not provide the required functionality. To begin with, three entries can be created for student, course and exam period. It would be correct to later add another entry for the student → subject relationship (Enrollment), maybe I will do this at the end as additional functionality.

Dashboard structure: Student Entry, Course Entry, Exam Period Entry, Management of Courses, Periods, and Student Registrations

Note: in the requirements, course is used in half of the cases and subject in the other half. I use subject as the fields, while visually my UI follows the required screenshots from the task.

## Step 7

Initially, the New Student component used: custom Apex controller, manual JSON construction, manual lightning-input, hardcoded values and a generic Something went wrong error.

The component was migrated to lightning-record-edit-form and standard Lightning Data Service. It uses real Salesforce fields, required constraints and Validation Rules are applied automatically, EMŠO validation remains on the server side, Payer is shown only for Part-time student, after successful creation the form is cleared, the user receives a success/error toast.

This made it possible to avoid implementing simple CRUD through Apex.

## Step 8

Course Entry LWC and Exam Period Entry LWC were added. In fact, they copy the New Student functionality, using their own fields.

## Step 9

The existing Registration Overview does not meet the requirements. Initially, the component showed only a limited list of registrations and did not meet the Dashboard requirements.

It is necessary to implement retrieval of the list of Courses, Exam Periods of the selected Course, Student Registrations in the period.

Then filter the data and display Student, EMŠO, Status, Grade and Result.

Also add registration creation, which works on a principle similar to the previous components. withdraw uses the functionality of the previously created Flow. When I created automatic insertion of today's date when unregistering, I did not notice that this was not in the requirements. This functionality seemed obvious to me and it is used in withdraw now.

The Apex controller RegistrationOverviewController was reworked and divided into separate methods for reading and changing data. @AuraEnabled(cacheable=true) is used for read methods. Separate server-side operations are used for data modification.

## Step 10

The Dashboard was brought to the structure shown in the customer's mockup. Instead of a flat registration table, a hierarchy of course, periods and students is used. Each period is an expandable section. The number of registrations for each period is also shown.

## Step 11

Additional Dashboard improvements were added.

success/error toast messages, loading states, blocking repeated button clicks while a request is running (an idempotency key could have been used, but it seemed excessive to me for this service), empty states for missing registrations and data refresh after register/unregister without a full page reload.

## Step 12

A Custom Report Type was created for creating the reports required by the task. I tried to fulfill the requirements as fully as possible, but the description of the two reports was not completely clear to me.

## Step 13

Quick wins beyond the original specification were added. Some of them I described earlier. I did not even write down some small additions either as wins or in this document.

1. Duplicate prevention.

It is forbidden to add the same Student to the same Course more than once. It is forbidden to register the same Student for the same Exam Period more than once. This prevents logically incorrect duplicates in the database.

2. Date-aware Exam lifecycle validation.

Before the exam date, it is forbidden to set Grade or move Registration to Completed. After the exam date, Withdraw is forbidden. This way, the registration state is tied to the real lifecycle of the Exam Period.

3. Safe Withdraw.

Before Withdraw, the user receives confirmation. Completed and already Unregistered registrations cannot be unregistered. History is not physically deleted.

## Result

The task is completed, the functionality has been checked and I did not find any errors. Suggestions for improvement: the previously described addition of creating a student enrollment into a subject from the dashboard. Also validation during exam registration that the student is enrolled in the subject.

The visual part turned out the worst for me, especially the tabs. I could not change the display from Recently Viewed, so to view Students, Registrations, Enrollments and Subjects normally, it is necessary to switch to the All view.

It also seems to me that the display of relationships on the tabs should be moved to the first page of the tab, this was not in the requirements and I could not do it quickly. Cross-object relationships are displayed when viewing the details of each record.

The recommended third report could show percentages of registration statuses. This could be useful for tracking students who refuse to take the exam. And with filters by subject and date, it would be possible to find out how long before the exam students decide to withdraw.