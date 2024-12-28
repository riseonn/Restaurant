public with sharing class MenuTable {
    @AuraEnabled(cacheable=true)
    public static List<Menu_Table__c> getMenuItems() {
        return [
            SELECT
                   MTID__c, 
                   User_Id__c,
                   Content__c, 
                   CreatedById, 
                   LastModifiedById, 
                   Name, 
                   OwnerId, 
                   Slug__c, 
                   Summary__c, 
                   Title__c, 
                   Type__c
            FROM Menu_Table__c
            LIMIT 50
        ];
    }

    // Method to update menu items, accepting a list of Menu_Table__c records
    @AuraEnabled
    public static void updateMenuItems(List<Menu_Table__c> menuItems) {
        if (menuItems == null || menuItems.isEmpty()) {
            throw new AuraHandledException('No menu items to update.');
        }

        try {
            // Perform update operation for the list of menu items
            update menuItems;
        } catch (Exception e) {
            // Log the full error details
            System.debug('Update Menu Item Error: ' + e.getMessage());
            System.debug('Stack Trace: ' + e.getStackTraceString());

            throw new AuraHandledException('Failed to update menu item(s): ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void updateMenuItem(Menu_Table__c menuItem) {
        if (menuItem == null) {
            throw new AuraHandledException('No menu item to update.');
        }

        try {
            System.debug('Menu Item to Update: ' + menuItem);
            update menuItem;
            System.debug('Menu Item updated successfully');
        } catch (Exception e) {
            System.debug('Update Menu Item Error: ' + e.getMessage());
            System.debug('Stack Trace: ' + e.getStackTraceString());
            
            throw new AuraHandledException('Failed to update menu item: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void deleteMenuItem(Id menuItemId) {
        if (menuItemId == null) {
            throw new AuraHandledException('Menu Item ID cannot be null');
        }
        try {
            Menu_Table__c menuItemToDelete = [
                SELECT Id
                FROM Menu_Table__c
                WHERE Id = :menuItemId
                LIMIT 1
            ];
            delete menuItemToDelete;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to delete menu item: ' + e.getMessage());
        }
    }
}
