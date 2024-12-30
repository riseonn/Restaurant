public with sharing class ItemChefTable {
    
    // Method to retrieve Item_Chef__c records
    @AuraEnabled(cacheable=true)
    public static List<Item_Chef__c> getItemChefs() {
        try {
            return [
                SELECT ITCT__c,
                       Active__c,
                       Chef_Id__c,
                       Name,
                       Item_Id__c,
                       CreatedById,
                       LastModifiedById,
                       OwnerId
                FROM Item_Chef__c
                ORDER BY CreatedDate DESC
                LIMIT 50
            ];
        } catch (Exception e) {
            // Log the error
            System.debug('Error retrieving item chefs: ' + e.getMessage());
            throw new AuraHandledException('Unable to retrieve item chefs: ' + e.getMessage());
        }
    }
    
    // Method to update Item_Chef__c records
    @AuraEnabled
    public static void updateItemChef(List<Item_Chef__c> itemChefList) {
        if (itemChefList == null || itemChefList.isEmpty()) {
            throw new AuraHandledException('No item chefs to update.');
        }

        try {
            // Perform update operation
            update itemChefList;
        } catch (DmlException e) {
            // Log the error details
            System.debug('Update Item Chef Error: ' + e.getMessage());
            throw new AuraHandledException('Failed to update item chef(s): ' + e.getMessage());
        }
    }
    
    // Method to delete Item_Chef__c record
    @AuraEnabled
    public static void deleteItemChef(Id itemChefId) {
        if (itemChefId == null) {
            throw new AuraHandledException('Item Chef ID cannot be null');
        }
        
        try {
            // Delete the Item_Chef__c record
            delete [SELECT Id FROM Item_Chef__c WHERE Id = :itemChefId LIMIT 1];
        } catch (DmlException e) {
            // Log the error
            System.debug('Delete Item Chef Error: ' + e.getMessage());
            throw new AuraHandledException('Failed to delete item chef: ' + e.getMessage());
        }
    }

    // Method to create Item_Chef__c record
    @AuraEnabled
    public static void createItemChef(Item_Chef__c itemChef) {
        if (itemChef == null) {
            throw new AuraHandledException('Item Chef cannot be null.');
        }

        try {
            // Insert the new Item_Chef__c record
            insert itemChef;
        } catch (DmlException e) {
            // Log the error details
            System.debug('Create Item Chef Error: ' + e.getMessage());
            throw new AuraHandledException('Failed to create item chef: ' + e.getMessage());
        }
    }
}
