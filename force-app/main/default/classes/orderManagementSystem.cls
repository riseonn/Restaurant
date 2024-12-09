public with sharing class orderManagementSystem {
    // Method to retrieve orders from the custom Order_Table__c object
    @AuraEnabled(cacheable=true)
    public static List<Order_Table__c> getOrders() {
        return [
            SELECT Id,
                   Last_Name__c,
                   Total__c,
                   City__c,
                   Content__c,
                   Country__c,
                   Created_At__c,
                   CreatedById,
                   Discount__c,
                   Email__c,
                   First_Name__c,
                   Grand_Total__c,
                   OTID__c,
                   Item_Discount__c,
                   LastModifiedById,
                   Line_1__c,
                   Line_2__c,
                   Middle_Name__c,
                   Mobile__c,
                   OwnerId,
                   Promo__c,
                   Province__c,
                   Shipping__c,
                   Status__c,
                   Sub_Total__c,
                   Tax__c,
                   Token__c,
                   Updated_At__c,
                   User_Id__c,
                   Vendor_Id__c
            FROM Order_Table__c
            LIMIT 50
        ];
    }
    
    // Method to update order records
    @AuraEnabled
    public static void updateOrder(List<Order_Table__c> orderList) {
        if (orderList == null || orderList.isEmpty()) {
            throw new AuraHandledException('No orders to update.');
        }
     
        try {
            // Log the order details before update (optional)
            System.debug('Orders to Update: ' + orderList);

            // Perform update operation for the list of orders
            update orderList;

            // Log successful update
            System.debug('Orders updated successfully');
        } catch (Exception e) {
            // Log the full error details
            System.debug('Update Order Error: ' + e.getMessage());
            System.debug('Stack Trace: ' + e.getStackTraceString());
            
            throw new AuraHandledException('Failed to update order(s): ' + e.getMessage());
        }
    }
    
    // Method to delete order from the custom Order_Table__c object
    @AuraEnabled
    public static void deleteOrder(Id orderId) {
        if (orderId == null) {
            throw new AuraHandledException('Order ID cannot be null');
        }
        try {
            // Query and delete the Order_Table__c record using the provided Id
            Order_Table__c orderToDelete = [
                SELECT Id
                FROM Order_Table__c
                WHERE Id = :orderId
                LIMIT 1
            ];
            delete orderToDelete;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to delete order: ' + e.getMessage());
        }
    }
}