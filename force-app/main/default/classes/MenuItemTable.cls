public with sharing class MenuItemTable {
    // Fetch Menu Item records
    @AuraEnabled(cacheable=true)
    public static List<Menu_Item_Table__c> getMenuItems() {
        try {
            return [
                SELECT MITID__c,
                MITEM_ID__c,
                Active__c,
                CreatedById,
                LastModifiedById,
                MENUIT_ID__c,
                Name,
                OwnerId
                FROM Menu_Item_Table__c
                ORDER BY CreatedDate DESC
                LIMIT 50
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving menu items: ' + e.getMessage());
        }
    }

    // Update Menu Item records
    @AuraEnabled
    public static void updateMenuItem(List<Menu_Item_Table__c> menuItemList) {
        try {
            update menuItemList;
        } catch (Exception e) {
            throw new AuraHandledException('Error updating menu item: ' + e.getMessage());
        }
    }

    // Delete Menu Item record
    @AuraEnabled
    public static void deleteMenuItem(String menuItemId) {
        try {
            if (String.isBlank(menuItemId)) {
                throw new AuraHandledException('Invalid Menu Item ID');
            }
            
            Menu_Item_Table__c itemToDelete = [
                SELECT Id 
                FROM Menu_Item_Table__c 
                WHERE Id = :menuItemId 
                LIMIT 1
            ];
            
            delete itemToDelete;
        } catch (Exception e) {
            throw new AuraHandledException('Error deleting menu item: ' + e.getMessage());
        }
    }
}
