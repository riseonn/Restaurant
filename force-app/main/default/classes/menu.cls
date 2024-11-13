@RestResource(urlMapping='/menu/*')
global with sharing class menu {
    @AuraEnabled(cacheable=true)
    public static List<Menu__c> getMenuItems() {
        return [
            SELECT Id, Name, Description__c, Price__c, Category__c
            FROM Menu__c 
            WHERE Active__c = true 
            ORDER BY Category__c, Name
        ];
    }
}
