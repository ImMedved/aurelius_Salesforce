Заметки по работе. В конце будут переведены на английский. ИИ агенты не применяются в работе над задачей. 

## Шаг 1

В ТЗ не указано, внес ли пользователь свои данные в базу данных. По этому был создан backup/database_backup. Так как все кастомные таблицы пусты, то я добавлю 4 csv файла в гит. В случае, если бы данные были в базе, их нельзя было бы добавлять. 

## Шаг 2

Необходимо привести базу данных к правильному состоянию. Сейчас есть 4 таблицы: 

Subject__c: CreatedById	LastModifiedById OwnerId Name

Student__c: CreatedById EMSO__c Enrollment_Type__c First_Name__c LastModifiedById Last_Name__c OwnerId Name

Exam__c: CreatedById Name LastModifiedById OwnerId

Exam_Registration__c: CreatedById Exam__c Name LastModifiedById Registration_Status__c Student__c

Требуется что-то вида: 

       Enrollment --- Subject 
      /                      \
Student                      Exam Period
      \                      /
          Exam Registration   

Таблицы должны быть: 

Student: 

Name / Student ID     Auto Number     Required
First Name            Text(40)        Required    255 -> 40
Last Name             Text(40)        Required    255 -> 40
EMŠO                  Text(13)        Required    int -> text(13)
Type                  Picklist        Required    Regular/Part-time
Payer                 Checkbox

Subject: 

Name                 Text(80)
ECTS                 Number           Required
Created By           CreatedById
Last Modified By     LastModifiedById
Owner                OwnerId

Exam: 

Name      Text(80)           Required   Label Exam name to Exam Period Name
Date__c   Date               Required
Subject__c Lookup(Subject__c) Required

Subject_Enrollment__c
Enrollment Id     Name          Required (Auto)
Student           Student__c    Required
Subject            Subject__c    Required


Exam Registration
Exam Period             Exam__c                  Master-Detail(Exam)           Change label
Registartion Status     Registration_Status__c   Picklist   Conditional        определить значения (Not yet completed, Completed, Not completed, Unregistered)
Result                  Result__c                Picklist   Conditional        Passed/Not passed
Grade                   Grade__c                 Number(2,0)   Conditional
Unregistration Date     Unregistration_Date__c   Date       Conditional

Student 1 -- N Enrollment N -- 1 Subject 1 -- N Exam 1 -- N Exam Registration N -- 1 Student

TODO: заменить EMSO на текст.

Шаг 3: добавить tabs для всех 5 объектов

Добавить Page Layout, проверить, что все обязательные поля действительно отмечены как обязательные. 

Внести правила для вноса Эмшо, Payer появляется только для Part-time Student, оценка только между 1 и 10 и другие правила. Проверить поля с выбором. 



