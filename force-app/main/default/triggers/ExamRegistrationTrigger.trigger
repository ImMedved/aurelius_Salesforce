trigger ExamRegistrationTrigger on Exam_Registration__c (before insert) {
    Set<Id> studentIds = new Set<Id>();
    Set<Id> examIds = new Set<Id>();

    for (Exam_Registration__c registration : Trigger.new) {
        if (registration.Student__c != null && registration.Exam__c != null) {
            studentIds.add(registration.Student__c);
            examIds.add(registration.Exam__c);
        }
    }

    if (studentIds.isEmpty() || examIds.isEmpty()) {
        return;
    }

    Set<String> existingPairs = new Set<String>();

    for (Exam_Registration__c registration : [
        SELECT Student__c, Exam__c
        FROM Exam_Registration__c
        WHERE Student__c IN :studentIds
        AND Exam__c IN :examIds
    ]) {
        existingPairs.add(registration.Student__c + ':' + registration.Exam__c);
    }

    Set<String> newPairs = new Set<String>();

    for (Exam_Registration__c registration : Trigger.new) {
        if (registration.Student__c == null || registration.Exam__c == null) {
            continue;
        }

        String pairKey = registration.Student__c + ':' + registration.Exam__c;

        if (existingPairs.contains(pairKey) || newPairs.contains(pairKey)) {
            registration.addError(
                'This student is already registered for the selected exam period.'
            );
        }

        newPairs.add(pairKey);
    }
}
