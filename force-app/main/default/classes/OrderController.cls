public with sharing class OrderController {
    @AuraEnabled(cacheable=true)
    public static List<Order_Item__c> getOrderedItems() {
        // Query the necessary fields from the database
        return [SELECT Id, OrderId__c, Ordered_Items__c, Status__c, Amount__c FROM Order_Item__c];
    }
}
