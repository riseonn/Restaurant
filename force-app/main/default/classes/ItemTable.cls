public with sharing class ItemTable { 
    /**
     * Retrieves a list of items
     * @return List of Item_Table__c records
     */
    @AuraEnabled(cacheable=true)
    public static List<Item_Table__c> getItems() {
        try {
            return [
                SELECT 
                IMID__c,
                Content__c,
                Cooking__c,
                CreatedById,
                Instructions__c,
                Name,
                LastModifiedById,
                OwnerId,
                Price__c,
                Quantity__c,
                Recipe__c,
                SKU__c,
                Slug__c,
                Summary__c,
                Title__c,
                Type__c,
                Unit__c,
                Vendor_Id__c
                FROM Item_Table__c
                ORDER BY CreatedDate DESC
                LIMIT 50
            ];
        } catch (QueryException e) {
            // Log the error for debugging
            System.debug('Error retrieving items: ' + e.getMessage());
            System.debug('Stack Trace: ' + e.getStackTraceString());
            
            // Throw a more descriptive AuraHandledException
            throw new AuraHandledException('Unable to retrieve items: ' + e.getMessage());
        } catch (Exception e) {
            // General exception catch for any unforeseen errors
            System.debug('General Error: ' + e.getMessage());
            System.debug('Stack Trace: ' + e.getStackTraceString());
            
            throw new AuraHandledException('Unable to retrieve items: ' + e.getMessage());
        }
    }

    /**
     * Deletes a specific item
     * @param itemId ID of the item to be deleted
     */
    @AuraEnabled
    public static void deleteItem(Id itemId) {
        if (itemId == null) {
            throw new AuraHandledException('Item ID cannot be null');
        }

        try {
            // Query the Item_Table__c record using the provided Id
            Item_Table__c itemToDelete = [SELECT Id FROM Item_Table__c WHERE Id = :itemId LIMIT 1];
            
            // Delete the record
            delete itemToDelete;
        } catch (QueryException e) {
            // Handle query-specific exceptions
            System.debug('Delete Item Query Error: ' + e.getMessage());
            throw new AuraHandledException('Failed to find item to delete: ' + e.getMessage());
        } catch (DmlException e) {
            // Handle DML-specific exceptions
            System.debug('Delete Item DML Error: ' + e.getMessage());
            throw new AuraHandledException('Failed to delete item: ' + e.getMessage());
        } catch (Exception e) {
            // Handle any general exceptions
            System.debug('Delete Item Error: ' + e.getMessage());
            throw new AuraHandledException('Failed to delete item: ' + e.getMessage());
        }
    }

    /**
     * Updates a list of items
     * @param itemList List of Item_Table__c records to be updated
     */
    @AuraEnabled
    public static void updateItem(List<Item_Table__c> itemList) {
        if (itemList == null || itemList.isEmpty()) {
            throw new AuraHandledException('No items to update.');
        }

        try {
            // Perform the update operation
            update itemList;
        } catch (DmlException e) {
            // Handle DML-specific exceptions
            System.debug('Update Item DML Error: ' + e.getMessage());
            throw new AuraHandledException('Failed to update item(s): ' + e.getMessage());
        } catch (Exception e) {
            // Handle any general exceptions
            System.debug('Update Item Error: ' + e.getMessage());
            throw new AuraHandledException('Failed to update item(s): ' + e.getMessage());
        }
    }
}
