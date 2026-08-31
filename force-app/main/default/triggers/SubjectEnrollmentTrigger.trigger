trigger SubjectEnrollmentTrigger on Subject_Enrollment__c (before insert) {
    Set<Id> studentIds = new Set<Id>();
    Set<Id> subjectIds = new Set<Id>();

    for (Subject_Enrollment__c enrollment : Trigger.new) {
        if (enrollment.Student__c != null && enrollment.Subject__c != null) {
            studentIds.add(enrollment.Student__c);
            subjectIds.add(enrollment.Subject__c);
        }
    }

    if (studentIds.isEmpty() || subjectIds.isEmpty()) {
        return;
    }

    Set<String> existingPairs = new Set<String>();

    for (Subject_Enrollment__c enrollment : [
        SELECT Student__c, Subject__c
        FROM Subject_Enrollment__c
        WHERE Student__c IN :studentIds
        AND Subject__c IN :subjectIds
    ]) {
        existingPairs.add(enrollment.Student__c + ':' + enrollment.Subject__c);
    }

    Set<String> newPairs = new Set<String>();

    for (Subject_Enrollment__c enrollment : Trigger.new) {
        if (enrollment.Student__c == null || enrollment.Subject__c == null) {
            continue;
        }

        String pairKey = enrollment.Student__c + ':' + enrollment.Subject__c;

        if (existingPairs.contains(pairKey) || newPairs.contains(pairKey)) {
            enrollment.addError(
                'This student is already enrolled in the selected subject.'
            );
        }

        newPairs.add(pairKey);
    }
}
