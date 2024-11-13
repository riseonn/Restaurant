public with sharing class MenuController {
    @AuraEnabled(cacheable=true)
    public static List<Menu__c> getMenuItems() {
        // Query the Menu object and return relevant fields.
        try {
            List<Menu__c> menuItems = [SELECT Id, Name, Description__c, Price__c FROM Menu__c];
            return menuItems;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching menu items: ' + e.getMessage());
        }
    }
}
