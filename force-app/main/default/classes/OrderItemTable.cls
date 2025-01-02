public with sharing class OrderItemTable {
    
    @AuraEnabled(cacheable=true)
    public static List<Order_Item_Table__c> getOrderItems() {
        return [
            SELECT Id, 
                   OITID__c, 
                   Content__c, 
                   Created_At__c, 
                   CreatedById, 
                   Discount__c, 
                   Item_Id__c, 
                   LastModifiedById, 
                   Order_Id__c, 
                   Name, 
                   OwnerId, 
                   Price__c, 
 
                   SKU__c, 
                   Unit__c, 
                   Updated_At__c
            FROM Order_Item_Table__c
            LIMIT 50
        ];
    }
    
    @AuraEnabled
    public static void updateOrderItem(Order_Item_Table__c orderItem) {
        if (orderItem == null) {
            throw new AuraHandledException('No order item to update.');
        }
     
        try {
            System.debug('Order Item to Update: ' + orderItem);
            update orderItem;
            System.debug('Order Item updated successfully');
        } catch (Exception e) {
            System.debug('Update Order Item Error: ' + e.getMessage());
            System.debug('Stack Trace: ' + e.getStackTraceString());
            throw new AuraHandledException('Failed to update order item: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void deleteOrderItem(Id orderItemId) {
        if (orderItemId == null) {
            throw new AuraHandledException('Order Item ID cannot be null');
        }
        try {
            Order_Item_Table__c orderItemToDelete = [
                SELECT Id
                FROM Order_Item_Table__c
                WHERE Id = :orderItemId
                LIMIT 1
            ];
            delete orderItemToDelete;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to delete order item: ' + e.getMessage());
        }
    }
}
