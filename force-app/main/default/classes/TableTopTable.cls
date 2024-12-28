public with sharing class TableTopTable {

    /**
     * Retrieves a list of TableTop records
     * @return List of TableTop_Table__c records
     */
    @AuraEnabled(cacheable=true)
    public static List<TableTop_Table__c> getTableTopRecords() {
        try {
            // Query the records from the TableTop_Table__c object
            return [
                SELECT 
                    TTID__c,
                    Capacity__c,
                    Code__c,
                    Content__c,
                    Status__c,
                    CreatedById,
                    LastModifiedById,
                    OwnerId
                    Name
                FROM TableTop_Table__c
                LIMIT 50
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving table top records: ' + e.getMessage());
        }
    }

    /**
     * Deletes a specific table top record
     * @param tableTopId ID of the table top record to be deleted
     */
    @AuraEnabled
    public static void deleteTableTop(Id tableTopId) {
        try {
            // Query and delete the TableTop record
            TableTop_Table__c tableTopToDelete = [SELECT Id FROM TableTop_Table__c WHERE Id = :tableTopId LIMIT 1];
            delete tableTopToDelete;
        } catch (Exception e) {
            throw new AuraHandledException('Error deleting table top record: ' + e.getMessage());
        }
    }
}
